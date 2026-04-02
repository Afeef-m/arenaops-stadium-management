using System;
using System.Linq;
using System.Text.Json;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Infrastructure.Services;

public class SectionService : ISectionService
{
    private readonly ISectionRepository _repository;

    public SectionService(ISectionRepository repository)
    {
        _repository = repository;
    }

    public async Task<ApiResponse<SectionResponse>> GetByIdAsync(Guid sectionId, CancellationToken cancellationToken = default)
    {
        var section = await _repository.GetByIdAsync(sectionId, cancellationToken);
        if (section == null)
            return ApiResponse<SectionResponse>.Fail("NOT_FOUND", "Section not found");

        return ApiResponse<SectionResponse>.Ok(MapToResponse(section));
    }

    public async Task<ApiResponse<List<SectionGeometryResponse>>> GetBySeatingPlanIdAsync(Guid seatingPlanId, CancellationToken cancellationToken = default)
    {
        var sections = await _repository.GetBySeatingPlanIdAsync(seatingPlanId, cancellationToken);
        var dtos = sections.Select(s => MapToGeometryResponse(s)).ToList();
        return ApiResponse<List<SectionGeometryResponse>>.Ok(dtos);
    }

    public async Task<ApiResponse<IEnumerable<SectionResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var sections = await _repository.GetAllAsync(cancellationToken);
        var dtos = sections.Select(MapToResponse);
        return ApiResponse<IEnumerable<SectionResponse>>.Ok(dtos);
    }

    public async Task<ApiResponse<SectionResponse>> CreateAsync(CreateSectionRequest request, Guid ownerId, CancellationToken cancellationToken = default)
    {
        // Verify seating plan exists
        var seatingPlanExists = await _repository.SeatingPlanExistsAsync(request.SeatingPlanId, cancellationToken);
        if (!seatingPlanExists)
            return ApiResponse<SectionResponse>.Fail("SEATING_PLAN_NOT_FOUND", "Seating plan not found");

        var section = new Section
        {
            SectionId = Guid.NewGuid(),
            SeatingPlanId = request.SeatingPlanId,
            Name = request.Name,
            Type = request.Type,
            Capacity = request.Capacity,
            SeatType = request.SeatType,
            Color = request.Color,
            PosX = request.PosX,
            PosY = request.PosY
        };

        var created = await _repository.CreateAsync(section, cancellationToken);
        return ApiResponse<SectionResponse>.Ok(MapToResponse(created), "Section created successfully");
    }

    public async Task<ApiResponse<SectionResponse>> UpdateAsync(Guid sectionId, UpdateSectionRequest request, Guid ownerId, CancellationToken cancellationToken = default)
    {
        var section = await _repository.GetByIdAsync(sectionId, cancellationToken);
        if (section == null)
            return ApiResponse<SectionResponse>.Fail("NOT_FOUND", "Section not found");

        // Only update display metadata — geometry/position are owned by the geometry endpoint
        section.Name     = request.Name;
        section.SeatType = request.SeatType;
        section.Color    = request.Color;

        var updated = await _repository.UpdateAsync(section, cancellationToken);
        return ApiResponse<SectionResponse>.Ok(MapToResponse(updated), "Section updated successfully");
    }

    public async Task<ApiResponse<object>> DeleteAsync(Guid sectionId, Guid ownerId, CancellationToken cancellationToken = default)
    {
        var section = await _repository.GetByIdAsync(sectionId, cancellationToken);
        if (section == null)
            return ApiResponse<object>.Fail("NOT_FOUND", "Section not found");

        var deleted = await _repository.DeleteAsync(sectionId, cancellationToken);
        if (!deleted)
            return ApiResponse<object>.Fail("DELETE_FAILED", "Could not delete section");

        return ApiResponse<object>.Ok(new { }, "Section deleted successfully");
    }

    // ============================================================================
    // Enhanced Geometry Methods
    // ============================================================================

    public async Task<ApiResponse<SectionGeometryResponse>> CreateArcSectionAsync(
        Guid seatingPlanId, CreateArcSectionRequest request, Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            // Verify seating plan exists
            var seatingPlanExists = await _repository.SeatingPlanExistsAsync(seatingPlanId, cancellationToken);
            if (!seatingPlanExists)
                return ApiResponse<SectionGeometryResponse>.Fail("SEATING_PLAN_NOT_FOUND", "Seating plan not found");

            var section = new Section
            {
                SectionId = Guid.NewGuid(),
                SeatingPlanId = seatingPlanId,
                Name = request.Name,
                Type = "Seated",
                SeatType = request.SeatType,
                Color = request.Color,
                PosX = request.CenterX,
                PosY = request.CenterY,

                // Geometry properties
                GeometryType = "arc",
                GeometryData = JsonSerializer.Serialize(new
                {
                    request.CenterX,
                    request.CenterY,
                    request.InnerRadius,
                    request.OuterRadius,
                    request.StartAngle,
                    request.EndAngle
                }),

                // Seating configuration
                Rows = request.Rows,
                SeatsPerRow = request.SeatsPerRow,
                VerticalAisles = request.VerticalAisles != null ? JsonSerializer.Serialize(request.VerticalAisles) : null,
                HorizontalAisles = request.HorizontalAisles != null ? JsonSerializer.Serialize(request.HorizontalAisles) : null,

                // Bowl assignment
                BowlId = request.BowlId
            };

            var created = await _repository.CreateAsync(section, cancellationToken);
            return ApiResponse<SectionGeometryResponse>.Ok(MapToGeometryResponse(created), "Arc section created successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<SectionGeometryResponse>.Fail("CREATE_ARC_SECTION_ERROR", ex.Message);
        }
    }

    public async Task<ApiResponse<SectionGeometryResponse>> CreateRectangleSectionAsync(
        Guid seatingPlanId, CreateRectangleSectionRequest request, Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            // Verify seating plan exists
            var seatingPlanExists = await _repository.SeatingPlanExistsAsync(seatingPlanId, cancellationToken);
            if (!seatingPlanExists)
                return ApiResponse<SectionGeometryResponse>.Fail("SEATING_PLAN_NOT_FOUND", "Seating plan not found");

            var section = new Section
            {
                SectionId = Guid.NewGuid(),
                SeatingPlanId = seatingPlanId,
                Name = request.Name,
                Type = "Seated",
                SeatType = request.SeatType,
                Color = request.Color,
                PosX = request.CenterX,
                PosY = request.CenterY,

                // Geometry properties
                GeometryType = "rectangle",
                GeometryData = JsonSerializer.Serialize(new
                {
                    request.CenterX,
                    request.CenterY,
                    request.Width,
                    request.Height,
                    request.Rotation
                }),

                // Seating configuration
                Rows = request.Rows,
                SeatsPerRow = request.SeatsPerRow,
                VerticalAisles = request.VerticalAisles != null ? JsonSerializer.Serialize(request.VerticalAisles) : null,
                HorizontalAisles = request.HorizontalAisles != null ? JsonSerializer.Serialize(request.HorizontalAisles) : null,

                // Bowl assignment
                BowlId = request.BowlId
            };

            var created = await _repository.CreateAsync(section, cancellationToken);
            return ApiResponse<SectionGeometryResponse>.Ok(MapToGeometryResponse(created), "Rectangle section created successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<SectionGeometryResponse>.Fail("CREATE_RECTANGLE_SECTION_ERROR", ex.Message);
        }
    }

    public async Task<ApiResponse<SectionGeometryResponse>> UpdateGeometryAsync(
        Guid sectionId, UpdateSectionGeometryRequest request, Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            var section = await _repository.GetByIdAsync(sectionId, cancellationToken);
            if (section == null)
                return ApiResponse<SectionGeometryResponse>.Fail("SECTION_NOT_FOUND", "Section not found");

            // Update geometry
            section.GeometryType = request.GeometryType;
            if (request.CenterX.HasValue)
                section.PosX = request.CenterX.Value;
            if (request.CenterY.HasValue)
                section.PosY = request.CenterY.Value;
            if (request.Rows.HasValue)
                section.Rows = request.Rows.Value;
            if (request.SeatsPerRow.HasValue)
                section.SeatsPerRow = request.SeatsPerRow.Value;

            if (request.VerticalAisles != null)
                section.VerticalAisles = JsonSerializer.Serialize(request.VerticalAisles);
            if (request.HorizontalAisles != null)
                section.HorizontalAisles = JsonSerializer.Serialize(request.HorizontalAisles);

            // Update geometry data JSON based on type
            if (request.GeometryType.ToLower() == "arc")
            {
                section.GeometryData = JsonSerializer.Serialize(new
                {
                    CenterX = request.CenterX,
                    CenterY = request.CenterY,
                    InnerRadius = request.InnerRadius,
                    OuterRadius = request.OuterRadius,
                    StartAngle = request.StartAngle,
                    EndAngle = request.EndAngle
                });
            }
            else if (request.GeometryType.ToLower() == "rectangle")
            {
                section.GeometryData = JsonSerializer.Serialize(new
                {
                    CenterX = request.CenterX,
                    CenterY = request.CenterY,
                    Width = request.Width,
                    Height = request.Height,
                    Rotation = request.Rotation
                });
            }

            var updated = await _repository.UpdateAsync(section, cancellationToken);
            return ApiResponse<SectionGeometryResponse>.Ok(MapToGeometryResponse(updated), "Section geometry updated successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<SectionGeometryResponse>.Fail("UPDATE_GEOMETRY_ERROR", ex.Message);
        }
    }

    public async Task<ApiResponse<SectionResponse>> AssignBowlAsync(
        Guid sectionId, Guid? bowlId, Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            var section = await _repository.GetByIdAsync(sectionId, cancellationToken);
            if (section == null)
                return ApiResponse<SectionResponse>.Fail("SECTION_NOT_FOUND", "Section not found");

            section.BowlId = bowlId;

            var updated = await _repository.UpdateAsync(section, cancellationToken);
            return ApiResponse<SectionResponse>.Ok(MapToResponse(updated),
                bowlId.HasValue ? $"Section assigned to bowl" : "Section unassigned from bowl");
        }
        catch (Exception ex)
        {
            return ApiResponse<SectionResponse>.Fail("ASSIGN_BOWL_ERROR", ex.Message);
        }
    }

    private static SectionGeometryResponse MapToGeometryResponse(Section section)
    {
        var response = new SectionGeometryResponse
        {
            SectionId = section.SectionId,
            SeatingPlanId = section.SeatingPlanId,
            Name = section.Name,
            Type = section.Type,
            Capacity = section.Capacity,
            SeatType = section.SeatType,
            Color = section.Color,

            // Geometry
            GeometryType = section.GeometryType,
            GeometryData = section.GeometryData,
            CenterX = section.PosX,
            CenterY = section.PosY,

            // Seating
            Rows = section.Rows,
            SeatsPerRow = section.SeatsPerRow,
            VerticalAisles = section.VerticalAisles != null ? JsonSerializer.Deserialize<int[]>(section.VerticalAisles) : null,
            HorizontalAisles = section.HorizontalAisles != null ? JsonSerializer.Deserialize<int[]>(section.HorizontalAisles) : null,

            // Bowl
            BowlId = section.BowlId,

            // Metadata
            SeatCount = section.Seats?.Count ?? 0
        };

        // Parse geometry data for more details if available
        if (!string.IsNullOrEmpty(section.GeometryType) && !string.IsNullOrEmpty(section.GeometryData))
        {
            try
            {
                using var doc = JsonDocument.Parse(section.GeometryData);
                var root = doc.RootElement;

                if (section.GeometryType.Equals("arc", StringComparison.OrdinalIgnoreCase))
                {
                    if (root.TryGetProperty("InnerRadius", out var ir)) response.InnerRadius = ir.GetDouble();
                    if (root.TryGetProperty("OuterRadius", out var or)) response.OuterRadius = or.GetDouble();
                    if (root.TryGetProperty("StartAngle", out var sa)) response.StartAngle = sa.GetDouble();
                    if (root.TryGetProperty("EndAngle", out var ea)) response.EndAngle = ea.GetDouble();
                }
                else if (section.GeometryType.Equals("rectangle", StringComparison.OrdinalIgnoreCase))
                {
                    if (root.TryGetProperty("Width", out var w)) response.Width = w.GetDouble();
                    if (root.TryGetProperty("Height", out var h)) response.Height = h.GetDouble();
                    if (root.TryGetProperty("Rotation", out var r)) response.Rotation = r.GetDouble();
                }
            }
            catch { /* Fallback to basic position data */ }
        }

        return response;
    }

    private static SectionResponse MapToResponse(Section section)
    {
        return new SectionResponse
        {
            SectionId = section.SectionId,
            SeatingPlanId = section.SeatingPlanId,
            SeatingPlanName = section.SeatingPlan?.Name ?? string.Empty,
            Name = section.Name,
            Type = section.Type,
            Capacity = section.Capacity,
            SeatType = section.SeatType,
            Color = section.Color,
            PosX = section.PosX,
            PosY = section.PosY,
            SeatCount = section.Seats?.Count ?? 0
        };
    }
}
