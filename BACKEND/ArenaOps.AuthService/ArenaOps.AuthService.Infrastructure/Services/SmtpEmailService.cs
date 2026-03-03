using ArenaOps.AuthService.Core.Interfaces;
using ArenaOps.AuthService.Core.Models;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace ArenaOps.AuthService.Infrastructure.Services;

public class SmtpEmailService : IEmailService
{
    private readonly SmtpSettings _settings;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IOptions<SmtpSettings> settings, ILogger<SmtpEmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendStadiumManagerCredentialsAsync(string email, string fullName, string tempPassword)
    {
        var subject = "ArenaOps: Stadium Manager Onboarding";
        var body = $@"
            <h2>Welcome to ArenaOps, {fullName}!</h2>
            <p>You have been registered as a Stadium Manager.</p>
            <p>Your login credentials are:</p>
            <ul>
                <li><strong>Email:</strong> {email}</li>
                <li><strong>Temporary Password:</strong> <code>{tempPassword}</code></li>
            </ul>
            <p>Please log in and change your password immediately using the <em>Change Password</em> option in your account settings, or use the <em>Forgot Password</em> flow.</p>
            <br/>
            <p>Regards,<br/>ArenaOps Team</p>";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendPasswordResetEmailAsync(string email, string resetToken)
    {
        var subject = "ArenaOps: Password Reset Request";
        var body = $@"
            <h2>Password Reset Request</h2>
            <p>Your password reset OTP is: <strong>{resetToken}</strong></p>
            <p>Please use this code to reset your password. It will expire in 15 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
            <br/>
            <p>Regards,<br/>ArenaOps Team</p>";

        await SendEmailAsync(email, subject, body);
    }

    private async Task SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromEmail));
            message.To.Add(new MailboxAddress(to, to));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = body };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            
            // Connect to the SMTP server
            await client.ConnectAsync(_settings.Server, _settings.Port, _settings.EnableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None);

            // Authenticate if credentials are provided
            if (!string.IsNullOrEmpty(_settings.Username))
            {
                await client.AuthenticateAsync(_settings.Username, _settings.Password);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent successfully to {To}", to);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
            // Re-throw or handle as per project policy. Given it's a critical service, re-throw might be better.
            throw;
        }
    }
}
