using System.ComponentModel.DataAnnotations;

namespace ArenaOps.CoreService.Application.DTOs;

// ─── Map Request ─────────────────────────────────────────────────

/// <summary>
/// Request body for POST /api/events/{id}/sections/{sId}/map-ticket.
/// Maps a TicketType to an EventSection.
/// </summary>
public class MapTicketToSectionRequest
{
    [Required(ErrorMessage = "Ticket type ID is required")]
    public Guid TicketTypeId { get; set; }
}

// ─── Response DTO ────────────────────────────────────────────────

/// <summary>
/// Returns ticket type details for a section mapping.
/// </summary>
public class SectionTicketTypeResponse
{
    public Guid EventSectionId { get; set; }
    public Guid TicketTypeId { get; set; }
    public string TicketTypeName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? SalePLU { get; set; }
}
