using ArenaOps.AuthService.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace ArenaOps.AuthService.Infrastructure.Services;

/// <summary>
/// Mock email service that logs credentials to console.
/// Replace with SMTP/SendGrid implementation in production.
/// </summary>
public class MockEmailService : IEmailService
{
    private readonly ILogger<MockEmailService> _logger;

    public MockEmailService(ILogger<MockEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendStadiumManagerCredentialsAsync(string email, string fullName, string tempPassword)
    {
        _logger.LogInformation(
            "═══════════════════════════════════════════════════════════════\n" +
            "  📧 STADIUM MANAGER ONBOARDING (Mock Email)\n" +
            "  ───────────────────────────────────────────────────────────\n" +
            "  To:             {Email}\n" +
            "  Name:           {FullName}\n" +
            "  Temp Password:  {TempPassword}\n" +
            "  ───────────────────────────────────────────────────────────\n" +
            "  ⚠️  Log in with this password and change it immediately.\n" +
            "═══════════════════════════════════════════════════════════════",
            email, fullName, tempPassword);

        return Task.CompletedTask;
    }

    public Task SendPasswordResetEmailAsync(string email, string resetToken)
    {
        _logger.LogInformation(
            "═══════════════════════════════════════════════════════════════\n" +
            "  📧 PASSWORD RESET OTP (Mock Email)\n" +
            "  ───────────────────────────────────────────────────────────\n" +
            "  To:   {Email}\n" +
            "  OTP:  {OtpCode}\n" +
            "  ───────────────────────────────────────────────────────────\n" +
            "  ⚠️  This code expires in 15 minutes.\n" +
            "═══════════════════════════════════════════════════════════════",
            email, resetToken);

        return Task.CompletedTask;
    }
}
