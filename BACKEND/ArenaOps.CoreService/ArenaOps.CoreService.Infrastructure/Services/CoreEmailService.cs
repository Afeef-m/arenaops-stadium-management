using ArenaOps.CoreService.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace ArenaOps.CoreService.Infrastructure.Services;

public class CoreEmailService : ICoreEmailService
{
    private readonly ILogger<CoreEmailService> _logger;

    public CoreEmailService(ILogger<CoreEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendEventApprovalRequestAsync(string stadiumManagerEmail, string stadiumName, string eventName, string eventManagerName)
    {
        _logger.LogInformation(
            "==========================================================\n" +
            "MOCK EMAIL SENT TO STADIUM MANAGER\n" +
            "To: {Email}\n" +
            "Subject: Action Required - New Event Approval for {Stadium}\n" +
            "Body:\n" +
            "Hello Stadium Manager,\n" +
            "Event Manager '{EventManager}' has requested to host the event '{Event}' at '{Stadium}'.\n" +
            "Please log in to your dashboard to review and either approve or cancel this event.\n" +
            "==========================================================",
            stadiumManagerEmail, stadiumName, eventManagerName, eventName, stadiumName);

        return Task.CompletedTask;
    }

    public Task SendEventApprovedNotificationAsync(string eventManagerEmail, string eventName, string stadiumName)
    {
        _logger.LogInformation(
            "==========================================================\n" +
            "MOCK EMAIL SENT TO EVENT MANAGER\n" +
            "To: {Email}\n" +
            "Subject: Your Event '{Event}' is Approved!\n" +
            "Body:\n" +
            "Hello Event Manager,\n" +
            "Your event '{Event}' at '{Stadium}' has been approved by the stadium manager.\n" +
            "You can now set the event status to 'Live' and start selling tickets.\n" +
            "==========================================================",
            eventManagerEmail, eventName, stadiumName);

        return Task.CompletedTask;
    }

    public Task SendEventCancelledNotificationAsync(string eventManagerEmail, string eventName, string stadiumName, string reason)
    {
        _logger.LogInformation(
            "==========================================================\n" +
            "MOCK EMAIL SENT TO EVENT MANAGER\n" +
            "To: {Email}\n" +
            "Subject: Your Event '{Event}' was Cancelled\n" +
            "Body:\n" +
            "Hello Event Manager,\n" +
            "Your event '{Event}' at '{Stadium}' has been cancelled.\n" +
            "Reason provided: {Reason}\n" +
            "Please contact the stadium administration for details.\n" +
            "==========================================================",
            eventManagerEmail, eventName, stadiumName, reason ?? "No reason provided.");

        return Task.CompletedTask;
    }
}
