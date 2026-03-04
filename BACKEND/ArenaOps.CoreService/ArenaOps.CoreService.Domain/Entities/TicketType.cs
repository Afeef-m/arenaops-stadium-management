namespace ArenaOps.CoreService.Domain.Entities;

/// <summary>
/// Ticket type for an event (e.g., VIP, Premium, Standard, General Admission).
/// Each event can have multiple ticket types with different pricing.
/// 
/// EventId is a logical reference — the Event entity will be added
/// in a separate task (same pattern as EventSeatingPlan).
/// </summary>
public class TicketType
{
    public Guid TicketTypeId { get; set; }
    public Guid EventId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? SalePLU { get; set; }
    public decimal Price { get; set; }

    // Navigation Properties
    public Event Event { get; set; } = null!;
    public ICollection<SectionTicketType> SectionTicketTypes { get; set; } = new List<SectionTicketType>();
}
