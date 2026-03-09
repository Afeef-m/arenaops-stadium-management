using System;
using ArenaOps.CoreService.Domain.Entities;

namespace ArenaOps.CoreService.Domain.Entities;

/// <summary>
/// Business profile for an Event Manager.
/// Stores business/organization info. Linked to Auth token sub via EventManagerId.
/// </summary>
public class EventManagerProfile
{
    public Guid EventManagerProfileId { get; set; }
    
    /// <summary>
    /// Foreign Key mapping to the Auth Users table UserId.
    /// Event Managers are authenticated users with the "EventManager" role.
    /// </summary>
    public Guid EventManagerId { get; set; }

    // Core Business Contact Data
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }

    // Organization Data
    public string? OrganizationName { get; set; }
    public string? GstNumber { get; set; }
    public string? Designation { get; set; }
    public string? Website { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
