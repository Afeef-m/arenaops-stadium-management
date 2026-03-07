using System.ComponentModel.DataAnnotations;

namespace ArenaOps.CoreService.Application.DTOs;

// ─── Create Request ──────────────────────────────────────────────

public class CreateEventSlotRequest
{
    /// <summary>
    /// Set from route parameter — not user-supplied.
    /// </summary>
    public Guid EventId { get; set; }

    [Required(ErrorMessage = "Start time is required")]
    public DateTime StartTime { get; set; }

    [Required(ErrorMessage = "End time is required")]
    public DateTime EndTime { get; set; }
}

// ─── Response DTO ────────────────────────────────────────────────

public class EventSlotResponse
{
    public Guid EventSlotId { get; set; }
    public Guid EventId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}
