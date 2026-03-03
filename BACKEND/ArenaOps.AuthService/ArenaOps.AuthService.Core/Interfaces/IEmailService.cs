namespace ArenaOps.AuthService.Core.Interfaces;

/// <summary>
/// Email service interface for sending notification emails.
/// Current implementation: Mock (logs to console).
/// Future: Replace with SMTP/SendGrid/etc.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Sends Stadium Manager onboarding email with a temporary password.
    /// The manager uses this to log in, then changes it via change-password or forgot-password.
    /// </summary>
    Task SendStadiumManagerCredentialsAsync(string email, string fullName, string tempPassword);

    /// <summary>
    /// Sends a password reset link/token.
    /// </summary>
    Task SendPasswordResetEmailAsync(string email, string resetToken);
}
