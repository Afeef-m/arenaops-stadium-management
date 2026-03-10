using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.CoreService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArenaOps.CoreService.Infrastructure.Repositories;

/// <summary>
/// EF Core repository for EventSeat data access.
///
/// Key design decisions:
/// - BulkCreateAsync uses AddRange + single SaveChangesAsync for performance.
///   Generating seats produces hundreds of rows — one DB round-trip is critical.
/// - GetByEventIdAsync traverses EventSeatingPlan → EventSections → EventSeats via joins
///   instead of N+1 queries per section.
/// </summary>
public class EventSeatRepository : IEventSeatRepository
{
    private readonly CoreDbContext _context;

    public EventSeatRepository(CoreDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Bulk-insert EventSeats in a single transaction.
    /// Returns the count of rows saved.
    /// </summary>
    public async Task<int> BulkCreateAsync(IEnumerable<EventSeat> seats, CancellationToken cancellationToken = default)
    {
        var seatList = seats.ToList();
        if (seatList.Count == 0)
            return 0;

        _context.EventSeats.AddRange(seatList);
        await _context.SaveChangesAsync(cancellationToken);
        return seatList.Count;
    }

    /// <summary>
    /// Get all EventSeats for a single EventSection, ordered for consistent display.
    /// </summary>
    public async Task<IEnumerable<EventSeat>> GetByEventSectionIdAsync(
        Guid eventSectionId, CancellationToken cancellationToken = default)
    {
        return await _context.EventSeats
            .Where(es => es.EventSectionId == eventSectionId)
            .OrderBy(es => es.RowLabel)
            .ThenBy(es => es.SeatNumber)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Get all EventSeats across an entire event.
    ///
    /// WHY join through EventSeatingPlan instead of a direct FK from EventSeat to EventId?
    /// EventSeat → EventSection → EventSeatingPlan → EventId is the canonical relationship.
    /// Adding a redundant EventId FK on EventSeat would denormalize the schema.
    /// </summary>
    public async Task<IEnumerable<EventSeat>> GetByEventIdAsync(
        Guid eventId, CancellationToken cancellationToken = default)
    {
        return await _context.EventSeats
            .Where(es => es.EventSection.EventSeatingPlan.EventId == eventId)
            .OrderBy(es => es.EventSection.Name)
            .ThenBy(es => es.RowLabel)
            .ThenBy(es => es.SeatNumber)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Idempotency check — returns true if any EventSeats exist for the event.
    /// Used to reject double-generation calls.
    /// </summary>
    public async Task<bool> AnyExistForEventAsync(
        Guid eventId, CancellationToken cancellationToken = default)
    {
        return await _context.EventSeats
            .AnyAsync(es => es.EventSection.EventSeatingPlan.EventId == eventId, cancellationToken);
    }

    /// <summary>
    /// Fetch template Seats for a given Section (SourceSectionId).
    /// Used during Seated section cloning to enumerate the seats to copy.
    /// Ordered the same way as GetBySectionIdAsync — Row then SeatNumber.
    /// </summary>
    public async Task<IEnumerable<Seat>> GetTemplateSeatsBySourceSectionIdAsync(
        Guid sourceSectionId, CancellationToken cancellationToken = default)
    {
        return await _context.Seats
            .Where(s => s.SectionId == sourceSectionId)
            .OrderBy(s => s.RowLabel)
            .ThenBy(s => s.SeatNumber)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Fetch minimum TicketType.Price per EventSectionId in one SQL query.
    ///
    /// SQL equivalent:
    ///   SELECT stt.EventSectionId, MIN(tt.Price)
    ///   FROM SectionTicketTypes stt
    ///   JOIN TicketTypes tt ON tt.TicketTypeId = stt.TicketTypeId
    ///   WHERE stt.EventSectionId IN (...)
    ///   GROUP BY stt.EventSectionId
    ///
    /// Returns a dictionary. EventSections with no mapping are absent → caller gets null.
    /// </summary>
    public async Task<Dictionary<Guid, decimal?>> GetMinPricesByEventSectionIdsAsync(
        IEnumerable<Guid> eventSectionIds, CancellationToken cancellationToken = default)
    {
        var ids = eventSectionIds.ToList();
        if (ids.Count == 0)
            return new Dictionary<Guid, decimal?>();

        return await _context.SectionTicketTypes
            .Where(stt => ids.Contains(stt.EventSectionId))
            .GroupBy(stt => stt.EventSectionId)
            .Select(g => new
            {
                EventSectionId = g.Key,
                MinPrice = g.Min(stt => (decimal?)stt.TicketType.Price)
            })
            .ToDictionaryAsync(
                x => x.EventSectionId,
                x => x.MinPrice,
                cancellationToken);
    }
}
