using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.CoreService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArenaOps.CoreService.Infrastructure.Repositories;

/// <summary>
/// EF Core repository for event layout data access.
/// 
/// OPTIMIZATION NOTES:
/// 
/// 1. EAGER LOADING (.Include): Every read method loads EventSections + EventLandmarks
///    in a SINGLE SQL query using JOINs. Without this, EF Core would do lazy loading
///    (3 separate queries = 3 DB round trips = slow).
/// 
/// 2. SINGLE SaveChangesAsync: When creating a layout, we add the parent EventSeatingPlan
///    with its children already attached via navigation properties. EF Core detects all
///    related entities and inserts them in one transaction. This means:
///    - 1 transaction (not 3 separate ones)
///    - If any insert fails, ALL are rolled back (atomicity)
///    - No orphaned records possible
/// 
/// 3. WHY GetByEventIdAsync (not GetByIdAsync for clone check)?
///    The frontend and service layer always work with EventId (from the URL route).
///    Looking up by EventId is the natural query pattern. We have an index on EventId
///    in the DB configuration to make this fast.
/// </summary>
public class EventLayoutRepository : IEventLayoutRepository
{
    private readonly CoreDbContext _context;

    public EventLayoutRepository(CoreDbContext context)
    {
        _context = context;
    }

    public async Task<EventSeatingPlan?> GetByEventIdAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        // Single query with JOINs — loads plan + sections + landmarks in one round trip
        return await _context.EventSeatingPlans
            .Include(esp => esp.SourceSeatingPlan)
            .Include(esp => esp.EventSections)
            .Include(esp => esp.EventLandmarks)
            .FirstOrDefaultAsync(esp => esp.EventId == eventId, cancellationToken);
    }

    public async Task<EventSeatingPlan?> GetByIdAsync(Guid eventSeatingPlanId, CancellationToken cancellationToken = default)
    {
        return await _context.EventSeatingPlans
            .Include(esp => esp.SourceSeatingPlan)
            .Include(esp => esp.EventSections)
            .Include(esp => esp.EventLandmarks)
            .FirstOrDefaultAsync(esp => esp.EventSeatingPlanId == eventSeatingPlanId, cancellationToken);
    }

    public async Task<EventSeatingPlan> CreateAsync(EventSeatingPlan eventSeatingPlan, CancellationToken cancellationToken = default)
    {
        // EF Core tracks the parent AND all children attached via navigation properties.
        // One SaveChangesAsync = one transaction = atomic insert of:
        //   - 1 EventSeatingPlan row
        //   - N EventSection rows
        //   - M EventLandmark rows
        _context.EventSeatingPlans.Add(eventSeatingPlan);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with navigation properties for response mapping
        return (await GetByEventIdAsync(eventSeatingPlan.EventId, cancellationToken))!;
    }

    public async Task<EventSeatingPlan> UpdateAsync(EventSeatingPlan eventSeatingPlan, CancellationToken cancellationToken = default)
    {
        _context.EventSeatingPlans.Update(eventSeatingPlan);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with navigation properties
        return (await GetByIdAsync(eventSeatingPlan.EventSeatingPlanId, cancellationToken))!;
    }

    public async Task<bool> DeleteAsync(Guid eventSeatingPlanId, CancellationToken cancellationToken = default)
    {
        var layout = await _context.EventSeatingPlans.FindAsync(new object[] { eventSeatingPlanId }, cancellationToken);
        if (layout == null)
            return false;

        // Cascade delete removes EventSections + EventLandmarks automatically
        // (configured in CoreDbContext with DeleteBehavior.Cascade)
        _context.EventSeatingPlans.Remove(layout);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> EventHasLayoutAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        // .AnyAsync is optimized — SQL translates to EXISTS (SELECT 1 ...)
        // Much faster than loading the full entity just to check existence
        return await _context.EventSeatingPlans
            .AnyAsync(esp => esp.EventId == eventId, cancellationToken);
    }
}
