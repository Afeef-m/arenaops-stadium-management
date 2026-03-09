using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.CoreService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArenaOps.CoreService.Infrastructure.Repositories;

public class SeatRepository : ISeatRepository
{
    private readonly CoreDbContext _context;

    public SeatRepository(CoreDbContext context)
    {
        _context = context;
    }

    public async Task<Seat?> GetByIdAsync(Guid seatId, CancellationToken cancellationToken = default)
    {
        return await _context.Seats
            .Include(s => s.Section)
            .FirstOrDefaultAsync(s => s.SeatId == seatId, cancellationToken);
    }

    public async Task<IEnumerable<Seat>> GetBySectionIdAsync(Guid sectionId, CancellationToken cancellationToken = default)
    {
        return await _context.Seats
            .Include(s => s.Section)
            .Where(s => s.SectionId == sectionId)
            .OrderBy(s => s.RowLabel)
            .ThenBy(s => s.SeatNumber)
            .ToListAsync(cancellationToken);
    }

    public async Task<Seat> CreateAsync(Seat seat, CancellationToken cancellationToken = default)
    {
        _context.Seats.Add(seat);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with navigation properties
        return (await GetByIdAsync(seat.SeatId, cancellationToken))!;
    }

    public async Task<IEnumerable<Seat>> CreateBulkAsync(IEnumerable<Seat> seats, CancellationToken cancellationToken = default)
    {
        var seatList = seats.ToList();
        if (seatList.Count == 0)
            return Enumerable.Empty<Seat>();

        _context.Seats.AddRange(seatList);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload using SectionId (indexed) instead of a large IN clause with hundreds of GUIDs.
        // All bulk-generated seats share the same SectionId, so this is both simpler and faster.
        var sectionId = seatList[0].SectionId;
        return await _context.Seats
            .Include(s => s.Section)
            .Where(s => s.SectionId == sectionId)
            .OrderBy(s => s.RowLabel)
            .ThenBy(s => s.SeatNumber)
            .ToListAsync(cancellationToken);
    }

    public async Task<Seat> UpdateAsync(Seat seat, CancellationToken cancellationToken = default)
    {
        _context.Seats.Update(seat);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with navigation properties
        return (await GetByIdAsync(seat.SeatId, cancellationToken))!;
    }

    public async Task<bool> DeleteAsync(Guid seatId, CancellationToken cancellationToken = default)
    {
        var seat = await _context.Seats.FindAsync(new object[] { seatId }, cancellationToken);
        if (seat == null)
            return false;

        _context.Seats.Remove(seat);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(Guid seatId, CancellationToken cancellationToken = default)
    {
        return await _context.Seats.AnyAsync(s => s.SeatId == seatId, cancellationToken);
    }

    public async Task<bool> SectionExistsAsync(Guid sectionId, CancellationToken cancellationToken = default)
    {
        return await _context.Sections.AnyAsync(s => s.SectionId == sectionId, cancellationToken);
    }

    public async Task<Section?> GetSectionWithPlanAsync(Guid sectionId, CancellationToken cancellationToken = default)
    {
        return await _context.Sections
            .Include(s => s.SeatingPlan)
            .FirstOrDefaultAsync(s => s.SectionId == sectionId, cancellationToken);
    }

    /// <summary>
    /// Traverses: Section (SectionId) ← EventSection (SourceSectionId) → SectionTicketType → TicketType.Price
    /// Returns the minimum price found, or null when no mapping exists yet.
    ///
    /// Chain:
    ///   1. EventSections where SourceSectionId = sectionId  (template → event copies)
    ///   2. Expand SectionTicketTypes for each EventSection   (event section → ticket mappings)
    ///   3. Project to TicketType.Price                       (the actual price)
    ///   4. Min() — safe default when multiple events share the same template section
    /// </summary>
    public async Task<decimal?> GetPriceBySourceSectionIdAsync(Guid sectionId, CancellationToken cancellationToken = default)
    {
        return await _context.EventSections
            .Where(es => es.SourceSectionId == sectionId)
            .SelectMany(es => es.SectionTicketTypes)
            .Select(stt => (decimal?)stt.TicketType.Price)
            .MinAsync(cancellationToken);
    }
}
