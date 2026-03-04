using System.ComponentModel.DataAnnotations;

namespace ArenaOps.CoreService.Application.DTOs;

// ─── Response DTO ────────────────────────────────────────────────

public class EventDto
{
    public Guid EventId { get; set; }
    public Guid StadiumId { get; set; }
    public string StadiumName { get; set; } = string.Empty;
    public Guid OrganizerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

// ─── Create Request ──────────────────────────────────────────────

public class CreateEventDto
{
    [Required]
    public Guid StadiumId { get; set; }

    [Required]
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Event name must be between 1 and 200 characters")]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }

    [StringLength(500, ErrorMessage = "Image URL cannot exceed 500 characters")]
    [Url(ErrorMessage = "Image URL must be a valid URL")]
    public string? ImageUrl { get; set; }
}

// ─── Update Request ──────────────────────────────────────────────

public class UpdateEventDto
{
    [Required]
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Event name must be between 1 and 200 characters")]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }

    [StringLength(500, ErrorMessage = "Image URL cannot exceed 500 characters")]
    [Url(ErrorMessage = "Image URL must be a valid URL")]
    public string? ImageUrl { get; set; }
}

// ─── Status Change Request ───────────────────────────────────────

public class UpdateEventStatusDto
{
    [Required(ErrorMessage = "Status is required")]
    [StringLength(20, ErrorMessage = "Status cannot exceed 20 characters")]
    public string Status { get; set; } = string.Empty;
}

// ─── Approval Request (Stadium Owner) ────────────────────────────

public class ReviewEventDto
{
    [Required]
    public bool IsApproved { get; set; }
    
    [StringLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
    public string? Reason { get; set; }
}
