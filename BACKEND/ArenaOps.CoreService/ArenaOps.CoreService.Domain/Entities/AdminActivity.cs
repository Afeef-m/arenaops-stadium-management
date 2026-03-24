namespace ArenaOps.CoreService.Domain.Entities;

/// <summary>
/// Tracks administrative activities and system events for the admin dashboard activity feed
/// </summary>
public class AdminActivity
{
    public Guid Id { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? EntityType { get; set; }
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserEmail { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? Metadata { get; set; }
}

public static class ActivityTypes
{
    // User Activities
    public const string UserRegistered = "UserRegistered";
    public const string UserActivated = "UserActivated";
    public const string UserDeactivated = "UserDeactivated";
    public const string UserRoleChanged = "UserRoleChanged";
    public const string UserLogin = "UserLogin";

    // Stadium Activities
    public const string StadiumCreated = "StadiumCreated";
    public const string StadiumApproved = "StadiumApproved";
    public const string StadiumRejected = "StadiumRejected";
    public const string StadiumUpdated = "StadiumUpdated";

    // Event Activities
    public const string EventCreated = "EventCreated";
    public const string EventPublished = "EventPublished";
    public const string EventCancelled = "EventCancelled";

    // Booking Activities
    public const string BookingCreated = "BookingCreated";
    public const string BookingConfirmed = "BookingConfirmed";
    public const string BookingCancelled = "BookingCancelled";

    // System Activities
    public const string SystemAlert = "SystemAlert";
    public const string SystemMaintenance = "SystemMaintenance";
}
