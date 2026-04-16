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
            "To: {EmailTo}\n" +
            "Subject: Action Required - New Event Approval for {SubjectStadium}\n" +
            "Body:\n" +
            "Hello Stadium Manager,\n" +
            "Event Manager '{EventManagerName}' has requested to host the event '{EventName}' at '{BodyStadium}'.\n" +
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
            "To: {EmailTo}\n" +
            "Subject: Your Event '{SubjectEvent}' is Approved!\n" +
            "Body:\n" +
            "Hello Event Manager,\n" +
            "Your event '{BodyEvent}' at '{StadiumName}' has been approved by the stadium manager.\n" +
            "You can now set the event status to 'Live' and start selling tickets.\n" +
            "==========================================================",
            eventManagerEmail, eventName, eventName, stadiumName);

        return Task.CompletedTask;
    }

    public Task SendEventCancelledNotificationAsync(string eventManagerEmail, string eventName, string stadiumName, string reason)
    {
        _logger.LogInformation(
            "==========================================================\n" +
            "MOCK EMAIL SENT TO EVENT MANAGER\n" +
            "To: {EmailTo}\n" +
            "Subject: Your Event '{SubjectEvent}' was Cancelled\n" +
            "Body:\n" +
            "Hello Event Manager,\n" +
            "Your event '{BodyEvent}' at '{StadiumName}' has been cancelled.\n" +
            "Reason provided: {Reason}\n" +
            "Please contact the stadium administration for details.\n" +
            "==========================================================",
            eventManagerEmail, eventName, eventName, stadiumName, reason ?? "No reason provided.");

        return Task.CompletedTask;
    }
}
