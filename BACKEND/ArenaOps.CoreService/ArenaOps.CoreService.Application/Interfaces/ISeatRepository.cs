using ArenaOps.CoreService.Domain.Entities;

namespace ArenaOps.CoreService.Application.Interfaces;

public interface ISeatRepository
{
    Task<Seat?> GetByIdAsync(Guid seatId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Seat>> GetBySectionIdAsync(Guid sectionId, CancellationToken cancellationToken = default);
    Task<Seat> CreateAsync(Seat seat, CancellationToken cancellationToken = default);
    Task<IEnumerable<Seat>> CreateBulkAsync(IEnumerable<Seat> seats, CancellationToken cancellationToken = default);
    Task<Seat> UpdateAsync(Seat seat, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid seatId, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid seatId, CancellationToken cancellationToken = default);
    Task<bool> SectionExistsAsync(Guid sectionId, CancellationToken cancellationToken = default);
    Task<Section?> GetSectionWithPlanAsync(Guid sectionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Looks up the assigned price for seats belonging to this section by traversing:
    ///   Section (SectionId) ← EventSection (SourceSectionId) → SectionTicketType → TicketType.Price
    ///
    /// Returns the minimum Price found across all EventSections referencing this template section.
    /// Returns null if no EventSection or SectionTicketType mapping exists yet.
    ///
    /// WHY minimum? If multiple events reference the same template section we take the
    /// lowest price as a safe default. In practice a section is typically used by one
    /// active event at a time.
    /// </summary>
    Task<decimal?> GetPriceBySourceSectionIdAsync(Guid sectionId, CancellationToken cancellationToken = default);
}
