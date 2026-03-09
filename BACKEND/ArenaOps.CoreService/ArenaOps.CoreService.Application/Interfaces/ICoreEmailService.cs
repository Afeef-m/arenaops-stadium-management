namespace ArenaOps.CoreService.Application.Interfaces;

public interface ICoreEmailService
{
    Task SendEventApprovalRequestAsync(string stadiumManagerEmail, string stadiumName, string eventName, string eventManagerName);
    Task SendEventApprovedNotificationAsync(string eventManagerEmail, string eventName, string stadiumName);
    Task SendEventCancelledNotificationAsync(string eventManagerEmail, string eventName, string stadiumName, string reason);
}
