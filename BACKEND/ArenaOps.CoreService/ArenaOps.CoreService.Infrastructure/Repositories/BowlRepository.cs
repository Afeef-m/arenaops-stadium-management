using Microsoft.EntityFrameworkCore;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Infrastructure.Data;

namespace ArenaOps.CoreService.Infrastructure.Repositories;

public class BowlRepository : IBowlRepository
{
    private readonly CoreDbContext _context;

    public BowlRepository(CoreDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> CreateAsync(Bowl bowl)
    {
        _context.Bowls.Add(bowl);
        await _context.SaveChangesAsync();
        return bowl.BowlId;
    }

    public async Task<Bowl?> GetByIdAsync(Guid bowlId)
    {
        return await _context.Bowls
            .Include(b => b.Sections)
            .FirstOrDefaultAsync(b => b.BowlId == bowlId);
    }

    public async Task<List<Bowl>> GetBySeatingPlanIdAsync(Guid seatingPlanId)
    {
        return await _context.Bowls
            .Where(b => b.SeatingPlanId == seatingPlanId)
            .Include(b => b.Sections)
            .OrderBy(b => b.DisplayOrder)
            .ToListAsync();
    }

    public async Task UpdateAsync(Bowl bowl)
    {
        _context.Bowls.Update(bowl);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid bowlId)
    {
        var bowl = await _context.Bowls.FindAsync(bowlId);
        if (bowl != null)
        {
            // Unassign all sections from this bowl
            var sections = await _context.Sections
                .Where(s => s.BowlId == bowlId)
                .ToListAsync();

            foreach (var section in sections)
            {
                section.BowlId = null;
            }

            _context.Bowls.Remove(bowl);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(Guid bowlId)
    {
        return await _context.Bowls.AnyAsync(b => b.BowlId == bowlId);
    }
}
