namespace ArenaOps.CoreService.Application.Interfaces;

public interface ICoreEmailService
{
    Task SendEventApprovalRequestAsync(string stadiumManagerEmail, string stadiumName, string eventName, string organizerName);
    Task SendEventApprovedNotificationAsync(string organizerEmail, string eventName, string stadiumName);
    Task SendEventCancelledNotificationAsync(string organizerEmail, string eventName, string stadiumName, string reason);
}
