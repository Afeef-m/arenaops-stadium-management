using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Infrastructure.Services;

/// <summary>
/// Business logic for organizer profile operations.
///
/// DESIGN NOTES:
///
/// 1. WHY all fields are optional on create?
///    Organizers register quickly (name + email + password via AuthService).
///    They may not have GST details ready at sign-up time. Forcing them to fill
///    in business details would increase drop-off. They can complete the profile
///    later from their settings page.
///
/// 2. WHY no "delete profile" operation?
///    Profiles are permanent once created — they are referenced by past events.
///    Organizers can only UPDATE their profile, not delete it.
///    If an account is deactivated, the Auth service handles that.
///
/// 3. WHY OrganizerId comes from JWT (not the request body)?
///    Security: if OrganizerId were in the body, any authenticated organizer
///    could create a profile for another organizer. JWT claim = tamper-proof.
/// </summary>
public class OrganizerProfileService : IOrganizerProfileService
{
    private readonly IOrganizerProfileRepository _repository;

    public OrganizerProfileService(IOrganizerProfileRepository repository)
    {
        _repository = repository;
    }

    public async Task<ApiResponse<OrganizerProfileResponse>> GetMyProfileAsync(
        Guid organizerId, CancellationToken cancellationToken = default)
    {
        var profile = await _repository.GetByOrganizerIdAsync(organizerId, cancellationToken);

        if (profile == null)
        {
            return ApiResponse<OrganizerProfileResponse>.Fail(
                "PROFILE_NOT_FOUND",
                "No business profile found. Create one via POST /api/organizer-profile.");
        }

        return ApiResponse<OrganizerProfileResponse>.Ok(MapToResponse(profile));
    }

    public async Task<ApiResponse<OrganizerProfileResponse>> CreateAsync(
        Guid organizerId, CreateOrganizerProfileRequest request, CancellationToken cancellationToken = default)
    {
        // Prevent duplicate profiles — one organizer → one profile
        var alreadyExists = await _repository.ExistsByOrganizerIdAsync(organizerId, cancellationToken);
        if (alreadyExists)
        {
            return ApiResponse<OrganizerProfileResponse>.Fail(
                "PROFILE_ALREADY_EXISTS",
                "You already have a business profile. Use PUT /api/organizer-profile/me to update it.");
        }

        var profile = new OrganizerProfile
        {
            OrganizerProfileId = Guid.NewGuid(),
            OrganizerId = organizerId,
            OrganizationName = request.OrganizationName?.Trim(),
            GstNumber = request.GstNumber?.Trim().ToUpperInvariant(),  // GST numbers are uppercase
            Designation = request.Designation?.Trim(),
            Website = request.Website?.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var created = await _repository.CreateAsync(profile, cancellationToken);

        return ApiResponse<OrganizerProfileResponse>.Ok(
            MapToResponse(created),
            "Business profile created successfully.");
    }

    public async Task<ApiResponse<OrganizerProfileResponse>> UpdateAsync(
        Guid organizerId, UpdateOrganizerProfileRequest request, CancellationToken cancellationToken = default)
    {
        var profile = await _repository.GetByOrganizerIdAsync(organizerId, cancellationToken);
        if (profile == null)
        {
            return ApiResponse<OrganizerProfileResponse>.Fail(
                "PROFILE_NOT_FOUND",
                "No profile to update. Create one first via POST /api/organizer-profile.");
        }

        // Update only provided fields (null = keep existing value)
        if (request.OrganizationName != null)
            profile.OrganizationName = request.OrganizationName.Trim();

        if (request.GstNumber != null)
            profile.GstNumber = request.GstNumber.Trim().ToUpperInvariant();

        if (request.Designation != null)
            profile.Designation = request.Designation.Trim();

        if (request.Website != null)
            profile.Website = request.Website.Trim();

        if (request.PhoneNumber != null)
            profile.PhoneNumber = request.PhoneNumber.Trim();

        profile.UpdatedAt = DateTime.UtcNow;

        var updated = await _repository.UpdateAsync(profile, cancellationToken);

        return ApiResponse<OrganizerProfileResponse>.Ok(
            MapToResponse(updated),
            "Business profile updated successfully.");
    }

    // ─── Mapping ──────────────────────────────────────────────────

    /// <summary>
    /// Manual mapping — same pattern as LandmarkService, SectionService, etc.
    /// No AutoMapper — explicit, debuggable, no reflection overhead.
    /// </summary>
    private static OrganizerProfileResponse MapToResponse(OrganizerProfile profile) =>
        new()
        {
            OrganizerProfileId = profile.OrganizerProfileId,
            OrganizerId = profile.OrganizerId,
            OrganizationName = profile.OrganizationName,
            GstNumber = profile.GstNumber,
            Designation = profile.Designation,
            Website = profile.Website,
            PhoneNumber = profile.PhoneNumber,
            CreatedAt = profile.CreatedAt,
            UpdatedAt = profile.UpdatedAt
        };
}
