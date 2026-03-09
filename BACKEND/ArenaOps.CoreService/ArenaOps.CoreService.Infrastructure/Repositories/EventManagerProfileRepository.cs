using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.CoreService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArenaOps.CoreService.Infrastructure.Repositories;

public class EventManagerProfileRepository : IEventManagerProfileRepository
{
    private readonly CoreDbContext _context;

    public EventManagerProfileRepository(CoreDbContext context)
    {
        _context = context;
    }

    public async Task<EventManagerProfile?> GetByEventManagerIdAsync(Guid eventManagerId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<EventManagerProfile>()
            .FirstOrDefaultAsync(p => p.EventManagerId == eventManagerId, cancellationToken);
    }

    public async Task<EventManagerProfile?> GetByIdAsync(Guid profileId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<EventManagerProfile>()
            .FirstOrDefaultAsync(p => p.EventManagerProfileId == profileId, cancellationToken);
    }

    public async Task<List<EventManagerProfile>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Set<EventManagerProfile>().ToListAsync(cancellationToken);
    }

    public async Task<bool> ExistsByEventManagerIdAsync(Guid eventManagerId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<EventManagerProfile>()
            .AnyAsync(p => p.EventManagerId == eventManagerId, cancellationToken);
    }

    public async Task<EventManagerProfile> CreateAsync(EventManagerProfile profile, CancellationToken cancellationToken = default)
    {
        await _context.Set<EventManagerProfile>().AddAsync(profile, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return profile;
    }

    public async Task<EventManagerProfile> UpdateAsync(EventManagerProfile profile, CancellationToken cancellationToken = default)
    {
        _context.Set<EventManagerProfile>().Update(profile);
        await _context.SaveChangesAsync(cancellationToken);
        return profile;
    }
}
