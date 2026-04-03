using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.Shared.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ArenaOps.CoreService.Infrastructure.Services;

public class SeatingPlanService : ISeatingPlanService
{
    private readonly ISeatingPlanRepository _repository;

    public SeatingPlanService(ISeatingPlanRepository repository)
    {
        _repository = repository;
    }

    public async Task<ApiResponse<SeatingPlanResponse>> GetByIdAsync(Guid seatingPlanId, CancellationToken cancellationToken = default)
    {
        var seatingPlan = await _repository.GetByIdAsync(seatingPlanId, cancellationToken);
        if (seatingPlan == null)
            return ApiResponse<SeatingPlanResponse>.Fail("NOT_FOUND", "Seating plan not found");

        return ApiResponse<SeatingPlanResponse>.Ok(MapToResponse(seatingPlan));
    }

    public async Task<ApiResponse<IEnumerable<SeatingPlanResponse>>> GetByStadiumIdAsync(Guid stadiumId, CancellationToken cancellationToken = default)
    {
        var seatingPlans = await _repository.GetByStadiumIdAsync(stadiumId, cancellationToken);
        var dtos = seatingPlans.Select(MapToResponse);
        return ApiResponse<IEnumerable<SeatingPlanResponse>>.Ok(dtos);
    }

    public async Task<ApiResponse<IEnumerable<SeatingPlanResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var seatingPlans = await _repository.GetAllAsync(cancellationToken);
        var dtos = seatingPlans.Select(MapToResponse);
        return ApiResponse<IEnumerable<SeatingPlanResponse>>.Ok(dtos);
    }

    public async Task<ApiResponse<SeatingPlanResponse>> CreateAsync(CreateSeatingPlanRequest request, Guid ownerId, CancellationToken cancellationToken = default)
    {
        // Verify stadium exists
        var stadiumExists = await _repository.StadiumExistsAsync(request.StadiumId, cancellationToken);
        if (!stadiumExists)
            return ApiResponse<SeatingPlanResponse>.Fail("STADIUM_NOT_FOUND", "Stadium not found");

        // Ensure 1:1 relationship between stadium and seating plan
        var existingPlans = await _repository.GetByStadiumIdAsync(request.StadiumId, cancellationToken);
        var existingPlan = existingPlans.FirstOrDefault();
        if (existingPlan != null)
        {
            return ApiResponse<SeatingPlanResponse>.Ok(MapToResponse(existingPlan), "Seating plan already exists");
        }

        var seatingPlan = new SeatingPlan
        {
            SeatingPlanId = Guid.NewGuid(),
            StadiumId = request.StadiumId,
            Name = request.Name,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        var created = await _repository.CreateAsync(seatingPlan, cancellationToken);
        return ApiResponse<SeatingPlanResponse>.Ok(MapToResponse(created), "Seating plan created successfully");
    }

    public async Task<ApiResponse<SeatingPlanResponse>> UpdateAsync(Guid seatingPlanId, UpdateSeatingPlanRequest request, Guid ownerId, CancellationToken cancellationToken = default)
    {
        var seatingPlan = await _repository.GetByIdAsync(seatingPlanId, cancellationToken);
        if (seatingPlan == null)
            return ApiResponse<SeatingPlanResponse>.Fail("NOT_FOUND", "Seating plan not found");

        // Update properties
        seatingPlan.Name = request.Name;
        seatingPlan.Description = request.Description;
        if (request.IsActive.HasValue)
        {
            seatingPlan.IsActive = request.IsActive.Value;
        }

        var updated = await _repository.UpdateAsync(seatingPlan, cancellationToken);
        return ApiResponse<SeatingPlanResponse>.Ok(MapToResponse(updated), "Seating plan updated successfully");
    }

    public async Task<ApiResponse<object>> DeleteAsync(Guid seatingPlanId, Guid ownerId, CancellationToken cancellationToken = default)
    {
        var seatingPlan = await _repository.GetByIdAsync(seatingPlanId, cancellationToken);
        if (seatingPlan == null)
            return ApiResponse<object>.Fail("NOT_FOUND", "Seating plan not found");

        var deleted = await _repository.DeleteAsync(seatingPlanId, cancellationToken);
        if (!deleted)
            return ApiResponse<object>.Fail("DELETE_FAILED", "Could not delete seating plan");

        return ApiResponse<object>.Ok(new { }, "Seating plan deleted successfully");
    }

    private static SeatingPlanResponse MapToResponse(SeatingPlan seatingPlan)
    {
        return new SeatingPlanResponse
        {
            SeatingPlanId = seatingPlan.SeatingPlanId,
            StadiumId = seatingPlan.StadiumId,
            StadiumName = seatingPlan.Stadium?.Name ?? string.Empty,
            Name = seatingPlan.Name,
            Description = seatingPlan.Description,
            CreatedAt = seatingPlan.CreatedAt,
            IsActive = seatingPlan.IsActive,
            SectionCount = seatingPlan.Sections?.Count ?? 0,
            LandmarkCount = seatingPlan.Landmarks?.Count ?? 0
        };
    }
}
