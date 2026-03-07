namespace ArenaOps.CoreService.Domain.Entities;

/// <summary>
/// Many-to-many mapping between EventSections and TicketTypes.
/// Composite PK: (EventSectionId, TicketTypeId).
/// 
/// Determines which ticket type applies to which section,
/// and ultimately the price assigned to EventSeats during generation.
/// 
/// Schema reference: 03-Database.md, Section G — SectionTicketType table.
/// </summary>
public class SectionTicketType
{
    public Guid EventSectionId { get; set; }
    public Guid TicketTypeId { get; set; }

    // Navigation Properties
    public EventSection EventSection { get; set; } = null!;
    public TicketType TicketType { get; set; } = null!;
}
