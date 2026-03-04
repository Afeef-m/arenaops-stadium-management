namespace ArenaOps.CoreService.Domain.Entities;

public class Event
{
    public Guid EventId { get; set; }
    public Guid StadiumId { get; set; }
    public Guid OrganizerId { get; set; } // Reference to Auth.Users (NOT a local FK)
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = EventStatuses.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation Properties
    public Stadium Stadium { get; set; } = null!;
    public ICollection<EventSlot> EventSlots { get; set; } = new List<EventSlot>();
}

/// <summary>
/// Centralized event status constants — single source of truth for the status workflow.
/// State machine: Draft → Live → Completed | Draft → Cancelled | Live → Cancelled
/// </summary>
public static class EventStatuses
{
    public const string Draft = "Draft";
    public const string PendingApproval = "PendingApproval";
    public const string Approved = "Approved";
    public const string Live = "Live";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";

    public static readonly IReadOnlyList<string> All = new[]
    {
        Draft, PendingApproval, Approved, Live, Completed, Cancelled
    };

    /// <summary>
    /// Returns the set of valid next statuses for a given current status.
    /// Terminal states (Completed, Cancelled) return an empty set.
    /// </summary>
    private static readonly IReadOnlyDictionary<string, IReadOnlyList<string>> AllowedTransitions =
        new Dictionary<string, IReadOnlyList<string>>
        {
            // Draft goes to PendingApproval (when Organizer submits for review) or Cancelled
            { Draft,           new[] { PendingApproval, Cancelled } },
            // PendingApproval goes to Approved or Cancelled (by Stadium Owner)
            { PendingApproval, new[] { Approved, Cancelled } },
            // Approved goes to Live (by Organizer) or Cancelled
            { Approved,        new[] { Live, Cancelled } },
            // Live goes to Completed or Cancelled
            { Live,            new[] { Completed, Cancelled } },
            
            { Completed,       Array.Empty<string>() },
            { Cancelled,       Array.Empty<string>() }
        };

    public static bool IsValid(string status) => All.Contains(status);

    public static bool CanTransition(string from, string to)
    {
        return AllowedTransitions.TryGetValue(from, out var allowed) && allowed.Contains(to);
    }

    public static IReadOnlyList<string> GetAllowedTransitions(string from)
    {
        return AllowedTransitions.TryGetValue(from, out var allowed)
            ? allowed
            : Array.Empty<string>();
    }
}
