using System.ComponentModel.DataAnnotations;

namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// Request body for POST /api/events/{id}/layout/clone
/// 
/// WHY only SeatingPlanId?
/// The EventId comes from the route parameter (not the body) — same pattern
/// as CreateLandmarkRequest where SeatingPlanId is set from the route.
/// This keeps the body minimal and avoids mismatches between URL and body.
/// </summary>
public class CloneLayoutRequest
{
    /// <summary>
    /// The base template SeatingPlan to clone from.
    /// </summary>
    [Required]
    public Guid SeatingPlanId { get; set; }
}
