using System.Security.Cryptography;
using ArenaOps.AuthService.Core.Interfaces;
using ArenaOps.AuthService.Core.Models;
using ArenaOps.AuthService.Infrastructure.Data;
using ArenaOps.AuthService.Infrastructure.Services;
using ArenaOps.Shared.Interfaces;
using ArenaOps.Shared.Models;
using ArenaOps.Shared.Services;
using ArenaOps.Shared.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using StackExchange.Redis;

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ---------------- SERILOG ----------------
    Log.Logger = new LoggerConfiguration()
        .ReadFrom.Configuration(builder.Configuration)
        .CreateLogger();

    builder.Host.UseSerilog();

    // ---------------- SERVICES ----------------
    builder.Services.AddControllers();

    // ---------------- REDIS ----------------
    var redisConnectionString = builder.Configuration.GetValue<string>("Redis:ConnectionString") ?? "localhost:6379";

    builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
        ConnectionMultiplexer.Connect(redisConnectionString));

    // ---------------- RATE LIMIT ----------------
    builder.Services.Configure<RateLimitSettings>(
        builder.Configuration.GetSection("RateLimiting"));

    // ---------------- CORS ----------------
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

    // ---------------- DATABASE ----------------
    builder.Services.AddDbContext<AuthDbContext>(options =>
        options.UseSqlServer(
            builder.Configuration.GetConnectionString("AuthDb"),
            sqlOptions => sqlOptions.MigrationsAssembly("ArenaOps.AuthService.Infrastructure")
        ));

    // ---------------- REPOSITORIES ----------------
    builder.Services.AddScoped<IAuthRepository, ArenaOps.AuthService.Infrastructure.Repositories.AuthRepository>();

    // ---------------- JWT SETTINGS ----------------
    builder.Services.Configure<JwtSettings>(
        builder.Configuration.GetSection("Jwt"));

    builder.Services.AddSingleton<ITokenService, TokenService>();

    // 🔑 Register RSA key ONCE (correct way)
    builder.Services.AddSingleton<RsaSecurityKey>(sp =>
    {
        var tokenService = sp.GetRequiredService<ITokenService>();
        var rsaParams = tokenService.GetPublicKey();

        var rsa = RSA.Create();
        rsa.ImportParameters(rsaParams);

        return new RsaSecurityKey(rsa);
    });

    // ---------------- AUTH SERVICES ----------------
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IUserManagementService, UserManagementService>();

    // ---------------- DAPPER ----------------
    builder.Services.AddSingleton<IDapperContext, DapperContext>();

    // ---------------- EMAIL ----------------
    builder.Services.Configure<SmtpSettings>(
        builder.Configuration.GetSection("Smtp"));
    builder.Services.AddScoped<IEmailService, SmtpEmailService>();

    // ---------------- TOKEN BLACKLIST ----------------
    builder.Services.AddSingleton<ITokenBlacklistService, RedisTokenBlacklistService>();

    // ---------------- GOOGLE AUTH ----------------
    builder.Services.Configure<GoogleAuthSettings>(
        builder.Configuration.GetSection("GoogleAuth"));
    builder.Services.AddHttpClient<IGoogleAuthService, GoogleAuthService>();

    // ---------------- AUTHENTICATION ----------------
    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer();

    // Configure JwtBearer using DI (THIS IS THE KEY FIX)
    builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
        .Configure<IOptions<JwtSettings>, RsaSecurityKey>((options, jwtSettings, key) =>
        {
            var settings = jwtSettings.Value;

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = settings.Issuer,

                ValidateAudience = true,
                ValidAudience = settings.Audience,

                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                IssuerSigningKey = key,
                ClockSkew = TimeSpan.FromMinutes(1)
            };

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

    // ---------------- SWAGGER ----------------
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "ArenaOps Auth Service",
            Version = "v1"
        });

        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header
        });

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

    // ---------------- APP ----------------
    var app = builder.Build();

    app.UseSerilogRequestLogging();

    app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    if (!app.Environment.IsDevelopment())
    {
        app.UseHttpsRedirection();
    }

    app.UseCors("AllowFrontend");

    app.UseMiddleware<RedisRateLimitMiddleware>();

    app.UseAuthentication();

    app.UseMiddleware<TokenBlacklistMiddleware>();

    app.UseAuthorization();

    app.MapHealthChecks("/health");
    app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "AuthService crashed");
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program { }