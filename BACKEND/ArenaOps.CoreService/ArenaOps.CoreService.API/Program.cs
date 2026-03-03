using Serilog;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Cryptography;
using StackExchange.Redis;
using ArenaOps.CoreService.Infrastructure.Data;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Application.Models;
using ArenaOps.CoreService.Infrastructure.Repositories;
using ArenaOps.CoreService.Infrastructure.Services;
using ArenaOps.Shared.Middleware;
using ArenaOps.Shared.Interfaces;
using ArenaOps.Shared.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// 2. Database Connection (Hosted DB)
var connectionString = builder.Configuration.GetConnectionString("CoreDb");

// 3. Register Services
builder.Services.AddSingleton<IDapperContext, DapperContext>();
builder.Services.AddScoped<IDapperQueryService, DapperQueryService>();

// Repositories
builder.Services.AddScoped<IStadiumRepository, StadiumRepository>();
builder.Services.AddScoped<ISeatingPlanRepository, SeatingPlanRepository>();
builder.Services.AddScoped<ISectionRepository, SectionRepository>();
builder.Services.AddScoped<ISeatRepository, SeatRepository>();
builder.Services.AddScoped<ILandmarkRepository, LandmarkRepository>();

// Services
builder.Services.AddScoped<IStadiumService, StadiumService>();
builder.Services.AddScoped<ISeatingPlanService, SeatingPlanService>();
builder.Services.AddScoped<ISectionService, SectionService>();
builder.Services.AddScoped<ISeatService, SeatService>();
builder.Services.AddScoped<ILandmarkService, LandmarkService>();
builder.Services.AddScoped<IAdminService, AdminService>();

// 3a-redis. Redis Cache
var redisConnectionString = builder.Configuration.GetValue<string>("Redis:ConnectionString") ?? "localhost:6379";
var redisInstanceName = builder.Configuration.GetValue<string>("Redis:InstanceName") ?? "ArenaOps_";

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = redisConnectionString;
    options.InstanceName = redisInstanceName;
});

builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    ConnectionMultiplexer.Connect(redisConnectionString));

builder.Services.Configure<CacheSettings>(builder.Configuration.GetSection("CacheSettings"));
builder.Services.AddScoped<ICacheService, RedisCacheService>();

// Rate Limiting — Redis-backed, config-driven
builder.Services.Configure<ArenaOps.Shared.Models.RateLimitSettings>(
    builder.Configuration.GetSection("RateLimiting"));

// Token Blacklist — Redis-backed, shared with AuthService
builder.Services.AddSingleton<ITokenBlacklistService, RedisTokenBlacklistService>();

// 3a. Register EF Core DbContext
builder.Services.AddDbContext<CoreDbContext>(options =>
    options.UseSqlServer(connectionString));

// 3b. Configure Authentication (Using local RSA public key)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var rsa = RSA.Create();
        var keyPath = Path.Combine(builder.Environment.ContentRootPath, "Keys", "rsa-public.key");

        if (File.Exists(keyPath))
        {
            var keyPem = File.ReadAllText(keyPath);
            rsa.ImportFromPem(keyPem);
        }

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "ArenaOps",
            ValidateAudience = true,
            ValidAudience = "ArenaOps",
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new RsaSecurityKey(rsa),
            ClockSkew = TimeSpan.Zero
        };
    });

// 3c. Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("StadiumOwner", policy => policy.RequireRole("StadiumOwner"));
    options.AddPolicy("Admin", policy => policy.RequireRole("Admin"));
    options.AddPolicy("Organizer", policy => policy.RequireRole("Organizer"));
});

// 3d. Controllers
builder.Services.AddControllers();

// 3e. Swagger/OpenAPI with JWT Bearer support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ArenaOps Core Service",
        Version = "v1",
        Description = "Core domain logic and management microservice for the ArenaOps platform.\n\n" +
                      "**Modules:** Stadium, Seating Plans, Sections, Seats, Events, Booking.\n" +
                      "**Authentication:** Use the Authorize button (🔒) to add your JWT token.\n" +
                      "**Format:** `Bearer <your-token>`"
    });

    // Add JWT Bearer security definition
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token.\n\nExample: `eyJhbGciOiJSUzI1NiIs...`"
    });

    // Apply Bearer token globally — endpoints with [Authorize] will show 🔒
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// 4. Add Health Checks
builder.Services.AddHealthChecks()
    .AddSqlServer(connectionString!, name: "SQL Server")
    .AddRedis(redisConnectionString, name: "Redis");

// 5. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// 6. Configure the HTTP request pipeline.
app.UseSerilogRequestLogging();
app.UseCors("AllowFrontend");

// Rate limiting — Redis-backed, before Auth
app.UseMiddleware<ArenaOps.Shared.Middleware.RedisRateLimitMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "ArenaOps Core Service v1");
    });
}

app.UseHttpsRedirection();
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
app.UseAuthentication();

// Token blacklist check — shared Redis blacklist, AFTER auth BEFORE authorization
app.UseMiddleware<ArenaOps.Shared.Middleware.TokenBlacklistMiddleware>();

app.UseAuthorization();

// 7. Map Endpoints
app.MapHealthChecks("/health");
app.MapGet("/", () => "ArenaOps CoreService API is running.");
app.MapControllers();

try
{
    Log.Information("Starting ArenaOps CoreService API...");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
