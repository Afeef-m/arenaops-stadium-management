using System.Security.Cryptography;
using System.Text.Json;
using ArenaOps.AuthService.Core.Interfaces;
using ArenaOps.Shared.Interfaces;
using ArenaOps.Shared.Services;
using ArenaOps.Shared.Models;
using ArenaOps.AuthService.Core.Models;
using ArenaOps.AuthService.Infrastructure.Data;
using ArenaOps.AuthService.Infrastructure.Services;
using ArenaOps.Shared.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using StackExchange.Redis;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

try
{
    var builder = WebApplication.CreateBuilder(args);

    // 1. Configure Serilog
    Log.Logger = new LoggerConfiguration()
        .ReadFrom.Configuration(builder.Configuration)
        .CreateLogger();

    builder.Host.UseSerilog();

    Log.Information("Starting ArenaOps AuthService API...");

    // Add services to the container.
    builder.Services.AddControllers();

// Redis — for rate limiting (shared with docker-compose)
var redisConnectionString = builder.Configuration.GetValue<string>("Redis:ConnectionString") ?? "localhost:6379";
builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    ConnectionMultiplexer.Connect(redisConnectionString));

// Rate Limiting — Redis-backed, config-driven
builder.Services.Configure<ArenaOps.Shared.Models.RateLimitSettings>(
    builder.Configuration.GetSection("RateLimiting"));

// CORS — allow frontend to call the API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "https://localhost:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Database — EF Core with SQL Server
builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("AuthDb"),
        sqlOptions => sqlOptions.MigrationsAssembly("ArenaOps.AuthService.Infrastructure")
    ));

// Repositories
builder.Services.AddScoped<IAuthRepository, ArenaOps.AuthService.Infrastructure.Repositories.AuthRepository>();

// JWT Configuration
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<ITokenService, TokenService>();

// Auth Service
builder.Services.AddScoped<IAuthService, ArenaOps.AuthService.Infrastructure.Services.AuthService>();

// Dapper Context
builder.Services.AddSingleton<ArenaOps.AuthService.Core.Interfaces.IDapperContext, ArenaOps.AuthService.Infrastructure.Data.DapperContext>();

// Health Checks
builder.Services.AddHealthChecks()
    .AddSqlServer(builder.Configuration.GetConnectionString("AuthDb")!, name: "Auth SQL Server");

// Email Service
builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("Smtp"));
builder.Services.AddScoped<IEmailService, SmtpEmailService>();

// Token Blacklist — Redis-backed so it's shared across all microservices
builder.Services.AddSingleton<ArenaOps.Shared.Interfaces.ITokenBlacklistService, RedisTokenBlacklistService>();

// Google OAuth
builder.Services.Configure<GoogleAuthSettings>(builder.Configuration.GetSection("GoogleAuth"));
builder.Services.AddHttpClient<IGoogleAuthService, GoogleAuthService>();

// JWT Bearer Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Resolve the TokenService to get the RSA public key for validation
    var sp = builder.Services.BuildServiceProvider();
    var tokenService = sp.GetRequiredService<ITokenService>();
    var rsaParams = tokenService.GetPublicKey();

    var rsa = RSA.Create();
    rsa.ImportParameters(rsaParams);

    var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new RsaSecurityKey(rsa),
        ClockSkew = TimeSpan.FromMinutes(1)
    };

    // Read JWT from cookie when Authorization header is absent
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (string.IsNullOrEmpty(context.Token) &&
                context.Request.Cookies.TryGetValue("accessToken", out var cookieToken))
            {
                context.Token = cookieToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Swagger/OpenAPI with JWT Bearer support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ArenaOps Auth Service",
        Version = "v1",
        Description = "Authentication & Authorization microservice for the ArenaOps platform.\n\n" +
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

var app = builder.Build();

// 2. Configure Serilog Request Logging
app.UseSerilogRequestLogging();

// Global exception handler — must be first in pipeline
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("v1/swagger.json", "ArenaOps Auth Service v1");
});

// Only redirect to HTTPS in production (dev uses HTTP only)
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// CORS — must be before Auth
app.UseCors("AllowFrontend");

// Rate limiting — Redis-backed, must be before Auth
app.UseMiddleware<RedisRateLimitMiddleware>();

app.UseAuthentication();

// Token blacklist check — must be AFTER authentication, BEFORE authorization
app.UseMiddleware<ArenaOps.Shared.Middleware.TokenBlacklistMiddleware>();

app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapControllers();



app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "AuthService host terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
