using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Infrastructure.Services;

public class EventManagerProfileService : IEventManagerProfileService
{
    private readonly IEventManagerProfileRepository _repository;

    public EventManagerProfileService(IEventManagerProfileRepository repository)
    {
        _repository = repository;
    }

    public async Task<ApiResponse<EventManagerProfileResponse>> GetMyProfileAsync(Guid eventManagerId, CancellationToken cancellationToken = default)
    {
        var profile = await _repository.GetByEventManagerIdAsync(eventManagerId, cancellationToken);
        if (profile == null)
            return ApiResponse<EventManagerProfileResponse>.Fail("PROFILE_NOT_FOUND", "Profile not found.");

        return ApiResponse<EventManagerProfileResponse>.Ok(MapToResponse(profile));
    }

    public async Task<ApiResponse<EventManagerProfileResponse>> GetProfileByIdAsync(Guid profileId, CancellationToken cancellationToken = default)
    {
        var profile = await _repository.GetByIdAsync(profileId, cancellationToken);
        if (profile == null)
            return ApiResponse<EventManagerProfileResponse>.Fail("PROFILE_NOT_FOUND", "Profile not found.");

        return ApiResponse<EventManagerProfileResponse>.Ok(MapToResponse(profile));
    }

    public async Task<ApiResponse<List<EventManagerProfileResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var profiles = await _repository.GetAllAsync(cancellationToken);
        var responses = profiles.Select(MapToResponse).ToList();
        return ApiResponse<List<EventManagerProfileResponse>>.Ok(responses);
    }

    public async Task<ApiResponse<EventManagerProfileResponse>> CreateAsync(Guid eventManagerId, CreateEventManagerProfileRequest request, CancellationToken cancellationToken = default)
    {
        var exists = await _repository.ExistsByEventManagerIdAsync(eventManagerId, cancellationToken);
        if (exists)
            return ApiResponse<EventManagerProfileResponse>.Fail("PROFILE_ALREADY_EXISTS", "Profile already exists.");

        var profile = new EventManagerProfile
        {
            EventManagerProfileId = Guid.NewGuid(),
            EventManagerId = eventManagerId,
            Email = request.Email.Trim().ToLowerInvariant(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            OrganizationName = request.OrganizationName?.Trim(),
            GstNumber = request.GstNumber?.Trim().ToUpperInvariant(),
            Designation = request.Designation?.Trim(),
            Website = request.Website?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var created = await _repository.CreateAsync(profile, cancellationToken);
        return ApiResponse<EventManagerProfileResponse>.Ok(MapToResponse(created), "Profile created effectively.");
    }

    public async Task<ApiResponse<EventManagerProfileResponse>> UpdateAsync(Guid eventManagerId, UpdateEventManagerProfileRequest request, CancellationToken cancellationToken = default)
    {
        var profile = await _repository.GetByEventManagerIdAsync(eventManagerId, cancellationToken);
        if (profile == null)
            return ApiResponse<EventManagerProfileResponse>.Fail("PROFILE_NOT_FOUND", "Profile not found.");

        if (request.Email != null) profile.Email = request.Email.Trim().ToLowerInvariant();
        if (request.PhoneNumber != null) profile.PhoneNumber = request.PhoneNumber.Trim();
        if (request.OrganizationName != null) profile.OrganizationName = request.OrganizationName.Trim();
        if (request.GstNumber != null) profile.GstNumber = request.GstNumber.Trim().ToUpperInvariant();
        if (request.Designation != null) profile.Designation = request.Designation.Trim();
        if (request.Website != null) profile.Website = request.Website.Trim();

        profile.UpdatedAt = DateTime.UtcNow;

        var updated = await _repository.UpdateAsync(profile, cancellationToken);
        return ApiResponse<EventManagerProfileResponse>.Ok(MapToResponse(updated), "Profile updated effectively.");
    }

    private static EventManagerProfileResponse MapToResponse(EventManagerProfile p)
    {
        return new EventManagerProfileResponse
        {
            EventManagerProfileId = p.EventManagerProfileId,
            EventManagerId = p.EventManagerId,
            Email = p.Email,
            PhoneNumber = p.PhoneNumber,
            OrganizationName = p.OrganizationName,
            GstNumber = p.GstNumber,
            Designation = p.Designation,
            Website = p.Website,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        };
    }
}
