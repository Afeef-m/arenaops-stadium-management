using ArenaOps.CoreService.Domain.Entities;

namespace ArenaOps.CoreService.Application.Interfaces;

/// <summary>
/// Repository interface for OrganizerProfile data access.
///
/// WHY GetByOrganizerIdAsync (not GetByIdAsync as the primary method)?
/// The controller always has the organizer's userId from JWT claims.
/// Looking up by OrganizerId is the natural pattern — same as
/// IEventLayoutRepository.GetByEventIdAsync where EventId is the route param.
///
/// The table has a UNIQUE index on OrganizerId — each organizer has exactly one profile.
/// </summary>
public interface IOrganizerProfileRepository
{
    /// <summary>
    /// Get organizer profile by the organizer's user ID (from JWT claims).
    /// </summary>
    Task<OrganizerProfile?> GetByOrganizerIdAsync(Guid organizerId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get organizer profile by its own primary key.
    /// </summary>
    Task<OrganizerProfile?> GetByIdAsync(Guid profileId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if a profile already exists for this organizer.
    /// Prevents duplicate profiles.
    /// </summary>
    Task<bool> ExistsByOrganizerIdAsync(Guid organizerId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create a new organizer profile.
    /// </summary>
    Task<OrganizerProfile> CreateAsync(OrganizerProfile profile, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update an existing organizer profile.
    /// </summary>
    Task<OrganizerProfile> UpdateAsync(OrganizerProfile profile, CancellationToken cancellationToken = default);
}
