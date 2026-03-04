using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Application.Interfaces;

public interface ISectionTicketTypeService
{
    /// <summary>
    /// Get all ticket types mapped to a specific event section.
    /// Validates that the section belongs to the specified event.
    /// </summary>
    Task<ApiResponse<IEnumerable<SectionTicketTypeResponse>>> GetTicketTypesForSectionAsync(
        Guid eventId, Guid eventSectionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Map a ticket type to an event section.
    /// Validates both the section and ticket type belong to the same event.
    /// </summary>
    Task<ApiResponse<SectionTicketTypeResponse>> MapTicketTypeToSectionAsync(
        Guid eventId, Guid eventSectionId, MapTicketToSectionRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove a ticket type mapping from an event section.
    /// </summary>
    Task<ApiResponse<bool>> UnmapTicketTypeFromSectionAsync(
        Guid eventId, Guid eventSectionId, Guid ticketTypeId, CancellationToken cancellationToken = default);
}
