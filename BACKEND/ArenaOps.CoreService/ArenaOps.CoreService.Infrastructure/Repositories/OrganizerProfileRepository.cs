using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.CoreService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArenaOps.CoreService.Infrastructure.Repositories;

/// <summary>
/// EF Core repository for OrganizerProfile data access.
///
/// OPTIMIZATION NOTES:
///
/// 1. GetByOrganizerIdAsync is the hot path — called on every profile read.
///    We have a UNIQUE index on OrganizerId so this is an index seek, not a scan.
///
/// 2. No .Include() needed. OrganizerProfile is a flat table — no navigation
///    properties to load. Single SELECT per query.
///
/// 3. Reload after create/update (same pattern as SeatingPlanRepository,
///    LandmarkRepository) ensures the response DTO has server-generated
///    values like CreatedAt set via GETUTCDATE() default.
/// </summary>
public class OrganizerProfileRepository : IOrganizerProfileRepository
{
    private readonly CoreDbContext _context;

    public OrganizerProfileRepository(CoreDbContext context)
    {
        _context = context;
    }

    public async Task<OrganizerProfile?> GetByOrganizerIdAsync(Guid organizerId, CancellationToken cancellationToken = default)
    {
        return await _context.OrganizerProfiles
            .FirstOrDefaultAsync(p => p.OrganizerId == organizerId, cancellationToken);
    }

    public async Task<OrganizerProfile?> GetByIdAsync(Guid profileId, CancellationToken cancellationToken = default)
    {
        return await _context.OrganizerProfiles
            .FirstOrDefaultAsync(p => p.OrganizerProfileId == profileId, cancellationToken);
    }

    public async Task<bool> ExistsByOrganizerIdAsync(Guid organizerId, CancellationToken cancellationToken = default)
    {
        // AnyAsync → translates to EXISTS (SELECT 1 ...) — faster than loading the entity
        return await _context.OrganizerProfiles
            .AnyAsync(p => p.OrganizerId == organizerId, cancellationToken);
    }

    public async Task<OrganizerProfile> CreateAsync(OrganizerProfile profile, CancellationToken cancellationToken = default)
    {
        _context.OrganizerProfiles.Add(profile);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload to pick up server-generated defaults (CreatedAt via GETUTCDATE())
        return (await GetByIdAsync(profile.OrganizerProfileId, cancellationToken))!;
    }

    public async Task<OrganizerProfile> UpdateAsync(OrganizerProfile profile, CancellationToken cancellationToken = default)
    {
        _context.OrganizerProfiles.Update(profile);
        await _context.SaveChangesAsync(cancellationToken);

        return (await GetByIdAsync(profile.OrganizerProfileId, cancellationToken))!;
    }
}
