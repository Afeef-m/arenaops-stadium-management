using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ArenaOps.CoreService.Domain.Entities;

namespace ArenaOps.CoreService.Application.Interfaces;

public interface IEventManagerProfileRepository
{
    Task<EventManagerProfile?> GetByEventManagerIdAsync(Guid eventManagerId, CancellationToken cancellationToken = default);
    Task<EventManagerProfile?> GetByIdAsync(Guid profileId, CancellationToken cancellationToken = default);
    Task<List<EventManagerProfile>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsByEventManagerIdAsync(Guid eventManagerId, CancellationToken cancellationToken = default);
    Task<EventManagerProfile> CreateAsync(EventManagerProfile profile, CancellationToken cancellationToken = default);
    Task<EventManagerProfile> UpdateAsync(EventManagerProfile profile, CancellationToken cancellationToken = default);
}
