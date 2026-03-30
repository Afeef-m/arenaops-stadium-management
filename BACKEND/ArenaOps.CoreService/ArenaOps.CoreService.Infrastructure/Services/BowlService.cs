using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.Shared.Models;
using ArenaOps.Shared.Exceptions;

namespace ArenaOps.CoreService.Infrastructure.Services;

public class BowlService : IBowlService
{
    private readonly IBowlRepository _bowlRepository;
    private readonly ISeatingPlanRepository _seatingPlanRepository;

    public BowlService(IBowlRepository bowlRepository, ISeatingPlanRepository seatingPlanRepository)
    {
        _bowlRepository = bowlRepository;
        _seatingPlanRepository = seatingPlanRepository;
    }

    public async Task<ApiResponse<BowlResponse>> CreateAsync(CreateBowlRequest request, Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            // Verify seating plan exists
            var seatingPlan = await _seatingPlanRepository.GetByIdAsync(request.SeatingPlanId, cancellationToken);
            if (seatingPlan == null)
            {
                return ApiResponse<BowlResponse>.Fail("SEATING_PLAN_NOT_FOUND", $"Seating plan {request.SeatingPlanId} not found");
            }

            // Create new bowl
            var bowl = new Bowl
            {
                BowlId = Guid.NewGuid(),
                SeatingPlanId = request.SeatingPlanId,
                Name = request.Name,
                Color = request.Color,
                DisplayOrder = request.DisplayOrder,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var bowlId = await _bowlRepository.CreateAsync(bowl);

            var response = new BowlResponse
            {
                BowlId = bowlId,
                SeatingPlanId = request.SeatingPlanId,
                Name = bowl.Name,
                Color = bowl.Color,
                DisplayOrder = bowl.DisplayOrder,
                IsActive = bowl.IsActive,
                SectionIds = new(),
                CreatedAt = bowl.CreatedAt
            };

            return ApiResponse<BowlResponse>.Ok(response, "Bowl created successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<BowlResponse>.Fail("BOWL_CREATE_ERROR", ex.Message);
        }
    }

    public async Task<ApiResponse<List<BowlResponse>>> GetBySeatingPlanIdAsync(Guid seatingPlanId, CancellationToken cancellationToken)
    {
        try
        {
            var bowls = await _bowlRepository.GetBySeatingPlanIdAsync(seatingPlanId);

            var responses = bowls.Select(b => new BowlResponse
            {
                BowlId = b.BowlId,
                SeatingPlanId = b.SeatingPlanId,
                Name = b.Name,
                Color = b.Color,
                DisplayOrder = b.DisplayOrder,
                IsActive = b.IsActive,
                SectionIds = b.Sections.Select(s => s.SectionId).ToList(),
                CreatedAt = b.CreatedAt
            }).ToList();

            return ApiResponse<List<BowlResponse>>.Ok(responses);
        }
        catch (Exception ex)
        {
            return ApiResponse<List<BowlResponse>>.Fail("BOWL_LIST_ERROR", ex.Message);
        }
    }

    public async Task<ApiResponse<BowlResponse>> GetByIdAsync(Guid bowlId, CancellationToken cancellationToken)
    {
        try
        {
            var bowl = await _bowlRepository.GetByIdAsync(bowlId);
            if (bowl == null)
            {
                return ApiResponse<BowlResponse>.Fail("BOWL_NOT_FOUND", $"Bowl {bowlId} not found");
            }

            var response = new BowlResponse
            {
                BowlId = bowl.BowlId,
                SeatingPlanId = bowl.SeatingPlanId,
                Name = bowl.Name,
                Color = bowl.Color,
                DisplayOrder = bowl.DisplayOrder,
                IsActive = bowl.IsActive,
                SectionIds = bowl.Sections.Select(s => s.SectionId).ToList(),
                CreatedAt = bowl.CreatedAt
            };

            return ApiResponse<BowlResponse>.Ok(response);
        }
        catch (Exception ex)
        {
            return ApiResponse<BowlResponse>.Fail("BOWL_GET_ERROR", ex.Message);
        }
    }

    public async Task<ApiResponse<BowlResponse>> UpdateAsync(Guid bowlId, UpdateBowlRequest request, Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            var bowl = await _bowlRepository.GetByIdAsync(bowlId);
            if (bowl == null)
            {
                return ApiResponse<BowlResponse>.Fail("BOWL_NOT_FOUND", $"Bowl {bowlId} not found");
            }

            bowl.Name = request.Name;
            bowl.Color = request.Color;
            bowl.DisplayOrder = request.DisplayOrder;

            await _bowlRepository.UpdateAsync(bowl);

            var response = new BowlResponse
            {
                BowlId = bowl.BowlId,
                SeatingPlanId = bowl.SeatingPlanId,
                Name = bowl.Name,
                Color = bowl.Color,
                DisplayOrder = bowl.DisplayOrder,
                IsActive = bowl.IsActive,
                SectionIds = bowl.Sections.Select(s => s.SectionId).ToList(),
                CreatedAt = bowl.CreatedAt
            };

            return ApiResponse<BowlResponse>.Ok(response, "Bowl updated successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<BowlResponse>.Fail("BOWL_UPDATE_ERROR", ex.Message);
        }
    }

    public async Task<ApiResponse<bool>> DeleteAsync(Guid bowlId, Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            var exists = await _bowlRepository.ExistsAsync(bowlId);
            if (!exists)
            {
                return ApiResponse<bool>.Fail("BOWL_NOT_FOUND", $"Bowl {bowlId} not found");
            }

            await _bowlRepository.DeleteAsync(bowlId);
            return ApiResponse<bool>.Ok(true, "Bowl deleted successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.Fail("BOWL_DELETE_ERROR", ex.Message);
        }
    }

    public async Task<ApiResponse<BowlResponse>> ReorderAsync(Guid bowlId, int newDisplayOrder, Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            var bowl = await _bowlRepository.GetByIdAsync(bowlId);
            if (bowl == null)
            {
                return ApiResponse<BowlResponse>.Fail("BOWL_NOT_FOUND", $"Bowl {bowlId} not found");
            }

            bowl.DisplayOrder = newDisplayOrder;
            await _bowlRepository.UpdateAsync(bowl);

            var response = new BowlResponse
            {
                BowlId = bowl.BowlId,
                SeatingPlanId = bowl.SeatingPlanId,
                Name = bowl.Name,
                Color = bowl.Color,
                DisplayOrder = bowl.DisplayOrder,
                IsActive = bowl.IsActive,
                SectionIds = bowl.Sections.Select(s => s.SectionId).ToList(),
                CreatedAt = bowl.CreatedAt
            };

            return ApiResponse<BowlResponse>.Ok(response, "Bowl reordered successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<BowlResponse>.Fail("BOWL_REORDER_ERROR", ex.Message);
        }
    }
}
