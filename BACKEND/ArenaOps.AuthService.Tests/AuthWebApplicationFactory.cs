using ArenaOps.AuthService.Infrastructure.Data;
using ArenaOps.AuthService.Infrastructure.Services;
using ArenaOps.AuthService.Core.Interfaces;
using ArenaOps.Shared.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;

namespace ArenaOps.AuthService.Tests;

public class AuthWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _tempKeyPath = Path.Combine(
        Path.GetTempPath(), $"arenaops_auth_test_{Guid.NewGuid():N}.key");

    private IServiceScope? _scope;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddJsonFile(
                Path.Combine(AppContext.BaseDirectory, "appsettings.Testing.json"),
                optional: false, reloadOnChange: false);

            // Override key path to a per-run temp file; TokenService auto-generates if absent
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:KeyFilePath"] = _tempKeyPath
            });
        });

        builder.ConfigureServices(services =>
        {
            // Use mock email service — no SMTP required in tests
            var emailDescriptor = services.FirstOrDefault(
                d => d.ServiceType == typeof(IEmailService));
            if (emailDescriptor != null) services.Remove(emailDescriptor);
            services.AddScoped<IEmailService, MockEmailService>();

            // Use in-memory token blacklist — no Redis required
            var blacklistDescriptor = services.FirstOrDefault(
                d => d.ServiceType == typeof(ITokenBlacklistService));
            if (blacklistDescriptor != null) services.Remove(blacklistDescriptor);
            services.AddSingleton<ITokenBlacklistService, InMemoryTokenBlacklistService>();
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        _scope = host.Services.CreateScope();
        var db = _scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        db.Database.Migrate();

        return host;
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing && _scope != null)
        {
            var db = _scope.ServiceProvider.GetRequiredService<AuthDbContext>();
            db.Database.EnsureDeleted();
            _scope.Dispose();
        }

        if (File.Exists(_tempKeyPath))
            File.Delete(_tempKeyPath);

        base.Dispose(disposing);
    }
}
