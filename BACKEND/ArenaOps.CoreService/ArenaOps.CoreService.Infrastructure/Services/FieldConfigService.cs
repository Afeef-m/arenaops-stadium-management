using System.Text.Json;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Infrastructure.Services;

public class FieldConfigService : IFieldConfigService
{
    private readonly ISeatingPlanRepository _seatingPlanRepository;

    public FieldConfigService(ISeatingPlanRepository seatingPlanRepository)
    {
        _seatingPlanRepository = seatingPlanRepository;
    }

    public async Task<ApiResponse<FieldConfigResponse>> GetBySeatingPlanIdAsync(Guid seatingPlanId, CancellationToken cancellationToken)
    {
        try
        {
            var seatingPlan = await _seatingPlanRepository.GetByIdAsync(seatingPlanId, cancellationToken);
            if (seatingPlan == null)
            {
                return ApiResponse<FieldConfigResponse>.Fail("SEATING_PLAN_NOT_FOUND", $"Seating plan {seatingPlanId} not found");
            }

            if (string.IsNullOrEmpty(seatingPlan.FieldConfigMetadata))
            {
                // Return default field config
                var defaultResponse = new FieldConfigResponse
                {
                    Shape = "round",
                    Length = 100,
                    Width = 53.3,
                    Unit = "yards",
                    BufferZone = 15,
                    MinimumInnerRadius = 65
                };
                return ApiResponse<FieldConfigResponse>.Ok(defaultResponse);
            }

            var config = JsonSerializer.Deserialize<FieldConfigResponse>(seatingPlan.FieldConfigMetadata);
            if (config == null)
            {
                return ApiResponse<FieldConfigResponse>.Fail("FIELD_CONFIG_PARSE_ERROR", "Failed to parse field configuration");
            }

            return ApiResponse<FieldConfigResponse>.Ok(config);
        }
        catch (Exception ex)
        {
            return ApiResponse<FieldConfigResponse>.Fail("FIELD_CONFIG_GET_ERROR", ex.Message);
        }
    }

    public async Task<ApiResponse<FieldConfigResponse>> UpdateAsync(Guid seatingPlanId, UpdateFieldConfigRequest request, Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            var seatingPlan = await _seatingPlanRepository.GetByIdAsync(seatingPlanId, cancellationToken);
            if (seatingPlan == null)
            {
                return ApiResponse<FieldConfigResponse>.Fail("SEATING_PLAN_NOT_FOUND", $"Seating plan {seatingPlanId} not found");
            }

            // Calculate minimum inner radius
            var minRadius = CalculateMinimumInnerRadius(request.Shape, request.Length, request.Width, request.BufferZone);

            // Create response with calculated radius
            var response = new FieldConfigResponse
            {
                Shape = request.Shape,
                Length = request.Length,
                Width = request.Width,
                Unit = request.Unit,
                BufferZone = request.BufferZone,
                MinimumInnerRadius = minRadius
            };

            // Serialize and store in SeatingPlan
            seatingPlan.FieldConfigMetadata = JsonSerializer.Serialize(response);
            await _seatingPlanRepository.UpdateAsync(seatingPlan, cancellationToken);

            return ApiResponse<FieldConfigResponse>.Ok(response, "Field configuration updated successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<FieldConfigResponse>.Fail("FIELD_CONFIG_UPDATE_ERROR", ex.Message);
        }
    }

    public double CalculateMinimumInnerRadius(string fieldShape, double length, double width, double bufferZone)
    {
        // Calculate the minimum inner radius based on field dimensions
        // For round fields: use the radius of the field
        // For rectangle fields: use half the diagonal distance

        double fieldRadius;

        if (fieldShape.ToLower() == "round")
        {
            // For a round field, the radius is half of the length (treat as diameter)
            fieldRadius = length / 2.0;
        }
        else if (fieldShape.ToLower() == "rectangle")
        {
            // For rectangle, calculate half the diagonal
            var diagonal = Math.Sqrt((length * length) + (width * width));
            fieldRadius = diagonal / 2.0;
        }
        else
        {
            fieldRadius = length / 2.0; // Default to round calculation
        }

        // Add buffer zone to get minimum inner radius for seating
        return fieldRadius + bufferZone;
    }
}
