using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Infrastructure.Services;

public class SeatService : ISeatService
{
    private readonly ISeatRepository _repository;

    public SeatService(ISeatRepository repository)
    {
        _repository = repository;
    }

    public async Task<ApiResponse<SeatResponse>> GetByIdAsync(Guid seatId, CancellationToken cancellationToken = default)
    {
        var seat = await _repository.GetByIdAsync(seatId, cancellationToken);
        if (seat == null)
            return ApiResponse<SeatResponse>.Fail("NOT_FOUND", "Seat not found");

        return ApiResponse<SeatResponse>.Ok(MapToResponse(seat));
    }

    public async Task<ApiResponse<IEnumerable<SeatResponse>>> GetBySectionIdAsync(Guid sectionId, CancellationToken cancellationToken = default)
    {
        // Verify section exists
        var sectionExists = await _repository.SectionExistsAsync(sectionId, cancellationToken);
        if (!sectionExists)
            return ApiResponse<IEnumerable<SeatResponse>>.Fail("SECTION_NOT_FOUND", "Section not found");

        var seats = await _repository.GetBySectionIdAsync(sectionId, cancellationToken);
        var dtos = seats.Select(MapToResponse);
        return ApiResponse<IEnumerable<SeatResponse>>.Ok(dtos);
    }

    public async Task<ApiResponse<SeatResponse>> CreateAsync(CreateSeatRequest request, Guid ownerId, CancellationToken cancellationToken = default)
    {
        // Verify section exists and is of type "Seated"
        var section = await _repository.GetSectionWithPlanAsync(request.SectionId, cancellationToken);
        if (section == null)
            return ApiResponse<SeatResponse>.Fail("SECTION_NOT_FOUND", "Section not found");

        if (section.Type != "Seated")
            return ApiResponse<SeatResponse>.Fail("INVALID_SECTION_TYPE", "Seats can only be added to Seated sections. This section is of type 'Standing'.");

        // Look up price from SectionTicketType via EventSection chain (null if no mapping yet)
        var price = await _repository.GetPriceBySourceSectionIdAsync(request.SectionId, cancellationToken);

        // Auto-generate seat label if not provided
        var seatLabel = request.SeatLabel ?? $"{request.RowLabel}{request.SeatNumber}";

        var seat = new Seat
        {
            SeatId = Guid.NewGuid(),
            SectionId = request.SectionId,
            RowLabel = request.RowLabel,
            SeatNumber = request.SeatNumber,
            SeatLabel = seatLabel,
            PosX = request.PosX,
            PosY = request.PosY,
            IsActive = request.IsActive,
            IsAccessible = request.IsAccessible,
            Price = price
        };

        var created = await _repository.CreateAsync(seat, cancellationToken);
        return ApiResponse<SeatResponse>.Ok(MapToResponse(created), "Seat created successfully");
    }

    public async Task<ApiResponse<IEnumerable<SeatResponse>>> BulkGenerateAsync(BulkGenerateSeatsRequest request, Guid ownerId, CancellationToken cancellationToken = default)
    {
        // Verify section exists and is of type "Seated"
        var section = await _repository.GetSectionWithPlanAsync(request.SectionId, cancellationToken);
        if (section == null)
            return ApiResponse<IEnumerable<SeatResponse>>.Fail("SECTION_NOT_FOUND", "Section not found");

        if (section.Type != "Seated")
            return ApiResponse<IEnumerable<SeatResponse>>.Fail("INVALID_SECTION_TYPE", "Bulk seat generation is only available for Seated sections. This section is of type 'Standing'.");

        // Look up price from SectionTicketType via EventSection chain.
        // Traverses: EventSection (SourceSectionId = sectionId) → SectionTicketType → TicketType.Price
        // Returns null when no EventSection/SectionTicketType mapping exists yet — seats will have Price = null.
        var price = await _repository.GetPriceBySourceSectionIdAsync(request.SectionId, cancellationToken);

        // Generate row labels starting from the provided label or "A"
        var startRow = request.StartRowLabel ?? "A";
        var startRowIndex = RowLabelToIndex(startRow);

        var seats = new List<Seat>();

        for (int row = 0; row < request.Rows; row++)
        {
            var rowLabel = IndexToRowLabel(startRowIndex + row);

            for (int seatNum = 1; seatNum <= request.SeatsPerRow; seatNum++)
            {
                seats.Add(new Seat
                {
                    SeatId = Guid.NewGuid(),
                    SectionId = request.SectionId,
                    RowLabel = rowLabel,
                    SeatNumber = seatNum,
                    SeatLabel = $"{rowLabel}{seatNum}",
                    PosX = request.StartPosX + ((seatNum - 1) * request.SpacingX),
                    PosY = request.StartPosY + (row * request.SpacingY),
                    IsActive = true,
                    IsAccessible = false,
                    Price = price
                });
            }
        }

        var created = await _repository.CreateBulkAsync(seats, cancellationToken);
        var responses = created.Select(MapToResponse);

        return ApiResponse<IEnumerable<SeatResponse>>.Ok(
            responses,
            $"Successfully generated {seats.Count} seats ({request.Rows} rows × {request.SeatsPerRow} seats per row)"
        );
    }

    public async Task<ApiResponse<SeatResponse>> UpdateAsync(Guid seatId, UpdateSeatRequest request, Guid ownerId, CancellationToken cancellationToken = default)
    {
        var seat = await _repository.GetByIdAsync(seatId, cancellationToken);
        if (seat == null)
            return ApiResponse<SeatResponse>.Fail("NOT_FOUND", "Seat not found");

        // Update properties
        seat.RowLabel = request.RowLabel;
        seat.SeatNumber = request.SeatNumber;
        seat.SeatLabel = request.SeatLabel ?? $"{request.RowLabel}{request.SeatNumber}";
        seat.PosX = request.PosX;
        seat.PosY = request.PosY;
        seat.IsActive = request.IsActive;
        seat.IsAccessible = request.IsAccessible;

        var updated = await _repository.UpdateAsync(seat, cancellationToken);
        return ApiResponse<SeatResponse>.Ok(MapToResponse(updated), "Seat updated successfully");
    }

    // ─── Private Helpers ────────────────────────────────────────────

    private static SeatResponse MapToResponse(Seat seat)
    {
        return new SeatResponse
        {
            SeatId = seat.SeatId,
            SectionId = seat.SectionId,
            SectionName = seat.Section?.Name ?? string.Empty,
            RowLabel = seat.RowLabel,
            SeatNumber = seat.SeatNumber,
            SeatLabel = seat.SeatLabel,
            PosX = seat.PosX,
            PosY = seat.PosY,
            IsActive = seat.IsActive,
            IsAccessible = seat.IsAccessible,
            Price = seat.Price
        };
    }

    /// <summary>
    /// Converts a row label to a zero-based index.
    /// A=0, B=1, ..., Z=25, AA=26, AB=27, ...
    /// </summary>
    private static int RowLabelToIndex(string label)
    {
        var upper = label.ToUpperInvariant();
        int index = 0;
        foreach (var c in upper)
        {
            index = index * 26 + (c - 'A' + 1);
        }
        return index - 1; // zero-based
    }

    /// <summary>
    /// Converts a zero-based index to a row label.
    /// 0=A, 1=B, ..., 25=Z, 26=AA, 27=AB, ...
    /// </summary>
    private static string IndexToRowLabel(int index)
    {
        var label = string.Empty;
        index++; // convert to 1-based
        while (index > 0)
        {
            index--;
            label = (char)('A' + (index % 26)) + label;
            index /= 26;
        }
        return label;
    }
}
