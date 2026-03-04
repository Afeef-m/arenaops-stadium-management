using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Application.Interfaces;

/// <summary>
/// Service interface for organizer profile operations.
/// Follows the same ApiResponse pattern as all other services in this project.
/// </summary>
public interface IOrganizerProfileService
{
    /// <summary>
    /// Get the authenticated organizer's own profile.
    /// Returns PROFILE_NOT_FOUND if they haven't created one yet.
    /// </summary>
    Task<ApiResponse<OrganizerProfileResponse>> GetMyProfileAsync(Guid organizerId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create a business profile for an organizer.
    /// All fields are optional — called after initial registration.
    /// Returns PROFILE_ALREADY_EXISTS (409) if one already exists.
    /// </summary>
    Task<ApiResponse<OrganizerProfileResponse>> CreateAsync(Guid organizerId, CreateOrganizerProfileRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update the authenticated organizer's business profile.
    /// Returns PROFILE_NOT_FOUND (404) if no profile exists yet.
    /// </summary>
    Task<ApiResponse<OrganizerProfileResponse>> UpdateAsync(Guid organizerId, UpdateOrganizerProfileRequest request, CancellationToken cancellationToken = default);
}
