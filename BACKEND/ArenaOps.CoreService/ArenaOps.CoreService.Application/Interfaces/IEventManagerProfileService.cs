using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Application.Interfaces;

public interface IEventManagerProfileService
{
    Task<ApiResponse<EventManagerProfileResponse>> GetMyProfileAsync(Guid eventManagerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<EventManagerProfileResponse>> GetProfileByIdAsync(Guid profileId, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<EventManagerProfileResponse>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<EventManagerProfileResponse>> CreateAsync(Guid eventManagerId, CreateEventManagerProfileRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<EventManagerProfileResponse>> UpdateAsync(Guid eventManagerId, UpdateEventManagerProfileRequest request, CancellationToken cancellationToken = default);
}
