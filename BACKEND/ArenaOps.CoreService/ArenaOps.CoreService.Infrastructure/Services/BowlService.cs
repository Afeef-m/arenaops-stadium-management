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
            cancellationToken.ThrowIfCancellationRequested();

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
                NumSections = request.NumSections,
                TemplateRows = request.TemplateRows,
                TemplateSeatsPerRow = request.TemplateSeatsPerRow,
                TemplateInnerRadius = request.TemplateInnerRadius,
                TemplateOuterRadius = request.TemplateOuterRadius,
                CreatedAt = DateTime.UtcNow
            };

            var bowlId = await _bowlRepository.CreateAsync(bowl);
            var response = MapToBowlResponse(bowl);

            return ApiResponse<BowlResponse>.Ok(response, "Bowl created successfully");
        }
        catch (OperationCanceledException)
        {
            return ApiResponse<BowlResponse>.Fail("REQUEST_CANCELLED", "Request was cancelled");
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
            cancellationToken.ThrowIfCancellationRequested();
            var bowls = await _bowlRepository.GetBySeatingPlanIdAsync(seatingPlanId);

            var responses = bowls.Select(MapToBowlResponse).ToList();
            return ApiResponse<List<BowlResponse>>.Ok(responses);

            return ApiResponse<List<BowlResponse>>.Ok(responses);
        }
        catch (OperationCanceledException)
        {
            return ApiResponse<List<BowlResponse>>.Fail("REQUEST_CANCELLED", "Request was cancelled");
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
            cancellationToken.ThrowIfCancellationRequested();

            var bowl = await _bowlRepository.GetByIdAsync(bowlId);
            if (bowl == null)
            {
                return ApiResponse<BowlResponse>.Fail("BOWL_NOT_FOUND", $"Bowl {bowlId} not found");
            }

            return ApiResponse<BowlResponse>.Ok(MapToBowlResponse(bowl));
        }
        catch (OperationCanceledException)
        {
            return ApiResponse<BowlResponse>.Fail("REQUEST_CANCELLED", "Request was cancelled");
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
            cancellationToken.ThrowIfCancellationRequested();

            var bowl = await _bowlRepository.GetByIdAsync(bowlId);
            if (bowl == null)
            {
                return ApiResponse<BowlResponse>.Fail("BOWL_NOT_FOUND", $"Bowl {bowlId} not found");
            }

            bowl.Name = request.Name;
            bowl.Color = request.Color;
            bowl.DisplayOrder = request.DisplayOrder;

            // Update template metadata
            bowl.NumSections = request.NumSections;
            bowl.TemplateRows = request.TemplateRows;
            bowl.TemplateSeatsPerRow = request.TemplateSeatsPerRow;
            bowl.TemplateInnerRadius = request.TemplateInnerRadius;
            bowl.TemplateOuterRadius = request.TemplateOuterRadius;

            await _bowlRepository.UpdateAsync(bowl);
            return ApiResponse<BowlResponse>.Ok(MapToBowlResponse(bowl), "Bowl updated successfully");
        }
        catch (OperationCanceledException)
        {
            return ApiResponse<BowlResponse>.Fail("REQUEST_CANCELLED", "Request was cancelled");
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
            cancellationToken.ThrowIfCancellationRequested();

            var exists = await _bowlRepository.ExistsAsync(bowlId);
            if (!exists)
            {
                return ApiResponse<bool>.Fail("BOWL_NOT_FOUND", $"Bowl {bowlId} not found");
            }

            await _bowlRepository.DeleteAsync(bowlId);
            return ApiResponse<bool>.Ok(true, "Bowl deleted successfully");
        }
        catch (OperationCanceledException)
        {
            return ApiResponse<bool>.Fail("REQUEST_CANCELLED", "Request was cancelled");
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
            cancellationToken.ThrowIfCancellationRequested();

            var bowl = await _bowlRepository.GetByIdAsync(bowlId);
            if (bowl == null)
            {
                return ApiResponse<BowlResponse>.Fail("BOWL_NOT_FOUND", $"Bowl {bowlId} not found");
            }

            bowl.DisplayOrder = newDisplayOrder;
            await _bowlRepository.UpdateAsync(bowl);
            return ApiResponse<BowlResponse>.Ok(MapToBowlResponse(bowl), "Bowl reordered successfully");
        }
        catch (OperationCanceledException)
        {
            return ApiResponse<BowlResponse>.Fail("REQUEST_CANCELLED", "Request was cancelled");
        }
        catch (Exception ex)
        {
            return ApiResponse<BowlResponse>.Fail("BOWL_REORDER_ERROR", ex.Message);
        }
    }

    private static BowlResponse MapToBowlResponse(Bowl bowl)
    {
        return new BowlResponse
        {
            BowlId = bowl.BowlId,
            SeatingPlanId = bowl.SeatingPlanId,
            Name = bowl.Name,
            Color = bowl.Color,
            DisplayOrder = bowl.DisplayOrder,
            IsActive = bowl.IsActive,
            SectionIds = bowl.Sections?.Select(s => s.SectionId).ToList() ?? new(),
            NumSections = bowl.NumSections,
            TemplateRows = bowl.TemplateRows,
            TemplateSeatsPerRow = bowl.TemplateSeatsPerRow,
            TemplateInnerRadius = bowl.TemplateInnerRadius,
            TemplateOuterRadius = bowl.TemplateOuterRadius,
            CreatedAt = bowl.CreatedAt
        };
    }
}
