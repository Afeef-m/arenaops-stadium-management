using System.ComponentModel.DataAnnotations;

namespace ArenaOps.CoreService.Application.DTOs;

public class CreateEventManagerProfileRequest
{
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Phone]
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(200)]
    public string? OrganizationName { get; set; }

    [MaxLength(20)]
    public string? GstNumber { get; set; }

    [MaxLength(100)]
    public string? Designation { get; set; }

    [Url]
    [MaxLength(300)]
    public string? Website { get; set; }
}

public class UpdateEventManagerProfileRequest
{
    [EmailAddress]
    [MaxLength(255)]
    public string? Email { get; set; }

    [Phone]
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(200)]
    public string? OrganizationName { get; set; }

    [MaxLength(20)]
    public string? GstNumber { get; set; }

    [MaxLength(100)]
    public string? Designation { get; set; }

    [Url]
    [MaxLength(300)]
    public string? Website { get; set; }
}

public class EventManagerProfileResponse
{
    public Guid EventManagerProfileId { get; set; }
    public Guid EventManagerId { get; set; }
    
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }

    public string? OrganizationName { get; set; }
    public string? GstNumber { get; set; }
    public string? Designation { get; set; }
    public string? Website { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public bool IsProfileComplete => !string.IsNullOrWhiteSpace(OrganizationName) 
                                     || !string.IsNullOrWhiteSpace(GstNumber);
}
