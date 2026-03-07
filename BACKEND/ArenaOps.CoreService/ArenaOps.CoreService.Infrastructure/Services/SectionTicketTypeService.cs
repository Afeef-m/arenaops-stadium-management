using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.Shared.Models;
using Microsoft.Extensions.Logging;

namespace ArenaOps.CoreService.Infrastructure.Services;

public class SectionTicketTypeService : ISectionTicketTypeService
{
    private readonly ISectionTicketTypeRepository _sectionTicketTypeRepository;
    private readonly IEventLayoutRepository _layoutRepository;
    private readonly ITicketTypeRepository _ticketTypeRepository;
    private readonly IEventRepository _eventRepository;
    private readonly ILogger<SectionTicketTypeService> _logger;

    public SectionTicketTypeService(
        ISectionTicketTypeRepository sectionTicketTypeRepository,
        IEventLayoutRepository layoutRepository,
        ITicketTypeRepository ticketTypeRepository,
        IEventRepository eventRepository,
        ILogger<SectionTicketTypeService> logger)
    {
        _sectionTicketTypeRepository = sectionTicketTypeRepository;
        _layoutRepository = layoutRepository;
        _ticketTypeRepository = ticketTypeRepository;
        _eventRepository = eventRepository;
        _logger = logger;
    }

    // ─── Queries ──────────────────────────────────────────────────

    public async Task<ApiResponse<IEnumerable<SectionTicketTypeResponse>>> GetTicketTypesForSectionAsync(
        Guid eventId, Guid eventSectionId, CancellationToken cancellationToken = default)
    {
        // 1. Validate event exists
        var eventEntity = await _eventRepository.GetByIdAsync(eventId);
        if (eventEntity == null)
            return ApiResponse<IEnumerable<SectionTicketTypeResponse>>.Fail("EVENT_NOT_FOUND", "Event not found");

        // 2. Validate section belongs to this event
        var validationResult = await ValidateSectionBelongsToEventAsync(eventId, eventSectionId, cancellationToken);
        if (validationResult != null)
            return ApiResponse<IEnumerable<SectionTicketTypeResponse>>.Fail(validationResult.Value.code, validationResult.Value.message);

        // 3. Get mappings
        var mappings = await _sectionTicketTypeRepository.GetByEventSectionIdAsync(eventSectionId, cancellationToken);
        var dtos = mappings.Select(MapToResponse);

        return ApiResponse<IEnumerable<SectionTicketTypeResponse>>.Ok(dtos);
    }

    // ─── Map Ticket Type to Section ───────────────────────────────

    public async Task<ApiResponse<SectionTicketTypeResponse>> MapTicketTypeToSectionAsync(
        Guid eventId, Guid eventSectionId, MapTicketToSectionRequest request, CancellationToken cancellationToken = default)
    {
        // 1. Validate event exists
        var eventEntity = await _eventRepository.GetByIdAsync(eventId);
        if (eventEntity == null)
            return ApiResponse<SectionTicketTypeResponse>.Fail("EVENT_NOT_FOUND", "Event not found");

        // 2. Validate section belongs to this event
        var sectionValidation = await ValidateSectionBelongsToEventAsync(eventId, eventSectionId, cancellationToken);
        if (sectionValidation != null)
            return ApiResponse<SectionTicketTypeResponse>.Fail(sectionValidation.Value.code, sectionValidation.Value.message);

        // 3. Validate ticket type exists and belongs to the same event
        var ticketType = await _ticketTypeRepository.GetByIdAsync(request.TicketTypeId, cancellationToken);
        if (ticketType == null)
            return ApiResponse<SectionTicketTypeResponse>.Fail("TICKET_TYPE_NOT_FOUND", "Ticket type not found");

        if (ticketType.EventId != eventId)
        {
            return ApiResponse<SectionTicketTypeResponse>.Fail(
                "TICKET_TYPE_EVENT_MISMATCH",
                "The ticket type does not belong to this event. " +
                "Both the section and ticket type must belong to the same event.");
        }

        // 4. Check for duplicate mapping
        var exists = await _sectionTicketTypeRepository.ExistsAsync(eventSectionId, request.TicketTypeId, cancellationToken);
        if (exists)
        {
            return ApiResponse<SectionTicketTypeResponse>.Fail(
                "MAPPING_ALREADY_EXISTS",
                "This ticket type is already mapped to this section");
        }

        // 5. Create the mapping
        var mapping = new SectionTicketType
        {
            EventSectionId = eventSectionId,
            TicketTypeId = request.TicketTypeId
        };

        var created = await _sectionTicketTypeRepository.AddMappingAsync(mapping, cancellationToken);

        _logger.LogInformation(
            "SectionTicketType mapping created: Section {SectionId} → TicketType {TicketTypeId} (Event {EventId})",
            eventSectionId, request.TicketTypeId, eventId);

        return ApiResponse<SectionTicketTypeResponse>.Ok(
            MapToResponse(created),
            "Ticket type mapped to section successfully");
    }

    // ─── Remove Mapping ───────────────────────────────────────────

    public async Task<ApiResponse<bool>> UnmapTicketTypeFromSectionAsync(
        Guid eventId, Guid eventSectionId, Guid ticketTypeId, CancellationToken cancellationToken = default)
    {
        // 1. Validate event exists
        var eventEntity = await _eventRepository.GetByIdAsync(eventId);
        if (eventEntity == null)
            return ApiResponse<bool>.Fail("EVENT_NOT_FOUND", "Event not found");

        // 2. Validate section belongs to this event
        var sectionValidation = await ValidateSectionBelongsToEventAsync(eventId, eventSectionId, cancellationToken);
        if (sectionValidation != null)
            return ApiResponse<bool>.Fail(sectionValidation.Value.code, sectionValidation.Value.message);

        // 3. Remove
        var removed = await _sectionTicketTypeRepository.RemoveMappingAsync(eventSectionId, ticketTypeId, cancellationToken);
        if (!removed)
            return ApiResponse<bool>.Fail("MAPPING_NOT_FOUND", "This ticket type is not mapped to this section");

        _logger.LogInformation(
            "SectionTicketType mapping removed: Section {SectionId} ✕ TicketType {TicketTypeId} (Event {EventId})",
            eventSectionId, ticketTypeId, eventId);

        return ApiResponse<bool>.Ok(true, "Ticket type unmapped from section successfully");
    }

    // ─── Helpers ──────────────────────────────────────────────────

    /// <summary>
    /// Validates that the given EventSection belongs to the specified event
    /// by checking via the EventSeatingPlan → EventSection chain.
    /// Returns null if valid, or an error tuple if invalid.
    /// </summary>
    private async Task<(string code, string message)?> ValidateSectionBelongsToEventAsync(
        Guid eventId, Guid eventSectionId, CancellationToken cancellationToken)
    {
        // Get the event layout (includes sections via eager loading)
        var layout = await _layoutRepository.GetByEventIdAsync(eventId, cancellationToken);
        if (layout == null)
            return ("LAYOUT_NOT_FOUND", "This event does not have a layout. Clone a template first.");

        // Check that the section exists within this event's layout
        var sectionExists = layout.EventSections.Any(s => s.EventSectionId == eventSectionId);
        if (!sectionExists)
            return ("SECTION_NOT_FOUND", "The specified section was not found in this event's layout");

        return null;
    }

    private static SectionTicketTypeResponse MapToResponse(SectionTicketType mapping)
    {
        return new SectionTicketTypeResponse
        {
            EventSectionId = mapping.EventSectionId,
            TicketTypeId = mapping.TicketTypeId,
            TicketTypeName = mapping.TicketType?.Name ?? string.Empty,
            Price = mapping.TicketType?.Price ?? 0,
            SalePLU = mapping.TicketType?.SalePLU
        };
    }
}
