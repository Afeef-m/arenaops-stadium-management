using ArenaOps.CoreService.Infrastructure.Data;
using ArenaOps.Shared.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;

namespace ArenaOps.CoreService.Tests;

/// <summary>
/// WebApplicationFactory for CoreService integration tests.
/// Generates an in-process RSA key pair — the public key is written to the content root
/// so the CoreService startup can load it. A helper method creates signed test JWTs.
/// </summary>
public class CoreWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly RSA _testRsa;
    private IServiceScope? _scope;

    public CoreWebApplicationFactory()
    {
        _testRsa = RSA.Create(2048);

        // Write the public key where CoreService Program.cs expects it:
        // Path.Combine(builder.Environment.ContentRootPath, "Keys", "rsa-public.key")
        // ContentRootPath in tests defaults to AppContext.BaseDirectory (test binary output dir).
        var keysDir = Path.Combine(AppContext.BaseDirectory, "Keys");
        Directory.CreateDirectory(keysDir);
        File.WriteAllText(Path.Combine(keysDir, "rsa-public.key"),
            _testRsa.ExportSubjectPublicKeyInfoPem());
    }

    /// <summary>Generates a signed JWT usable against this factory's CoreService instance.</summary>
    public string GenerateTestJwt(Guid userId, string role = "Admin")
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, role)
        };

        var credentials = new SigningCredentials(
            new RsaSecurityKey(_testRsa),
            SecurityAlgorithms.RsaSha256);

        var token = new JwtSecurityToken(
            issuer: "ArenaOps",
            audience: "ArenaOps",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddJsonFile(
                Path.Combine(AppContext.BaseDirectory, "appsettings.Testing.json"),
                optional: false, reloadOnChange: false);
        });

        builder.ConfigureServices(services =>
        {
            // Replace distributed cache with in-memory — no Redis required
            var dcDescriptor = services.FirstOrDefault(
                d => d.ServiceType == typeof(IDistributedCache));
            if (dcDescriptor != null) services.Remove(dcDescriptor);
            services.AddDistributedMemoryCache();

            // Use no-op token blacklist — no Redis required
            var blacklistDescriptor = services.FirstOrDefault(
                d => d.ServiceType == typeof(ITokenBlacklistService));
            if (blacklistDescriptor != null) services.Remove(blacklistDescriptor);
            services.AddSingleton<ITokenBlacklistService, NoOpTokenBlacklistService>();
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        _scope = host.Services.CreateScope();
        var db = _scope.ServiceProvider.GetRequiredService<CoreDbContext>();
        db.Database.Migrate();

        return host;
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing && _scope != null)
        {
            var db = _scope.ServiceProvider.GetRequiredService<CoreDbContext>();
            db.Database.EnsureDeleted();
            _scope.Dispose();
        }

        _testRsa.Dispose();
        base.Dispose(disposing);
    }
}

/// <summary>No-op ITokenBlacklistService for integration tests — never blacklists tokens.</summary>
internal sealed class NoOpTokenBlacklistService : ITokenBlacklistService
{
    public void BlacklistToken(string jti, DateTime expiresAt) { }
    public bool IsBlacklisted(string jti) => false;
}
