using ArenaOps.CoreService.Domain.Entities;

namespace ArenaOps.CoreService.Application.Interfaces;

public interface IEventRepository
{
    Task<IEnumerable<Event>> GetAllAsync();
    Task<IEnumerable<Event>> GetByStatusAsync(string status);
    Task<Event?> GetByIdAsync(Guid id);
    Task<IEnumerable<Event>> GetByOrganizerAsync(Guid organizerId);
    Task<IEnumerable<Event>> GetByStadiumAsync(Guid stadiumId);
    Task AddAsync(Event eventEntity);
    Task UpdateAsync(Event eventEntity);
    Task SaveChangesAsync();
}
