namespace ArenaOps.CoreService.Application.DTOs;

public class TicketTypeResponse
{
    public Guid TicketTypeId { get; set; }
    public Guid EventId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? SalePLU { get; set; }
    public decimal Price { get; set; }
}
