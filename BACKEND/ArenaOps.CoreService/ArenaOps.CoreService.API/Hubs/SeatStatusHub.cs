using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ArenaOps.CoreService.API.Hubs;

/// <summary>
/// Real-time seat status broadcasting hub.
///
/// Groups:
///   Each event gets a SignalR group named "event-{eventId}".
///   Clients join when opening a seat map and leave when navigating away.
///
/// Broadcast events (sent by services, not directly by clients):
///   - SeatStatusChanged   → single seat update  (seatId, newStatus, userId?)
///   - BulkSeatStatusChanged → batch update after hold cleanup
/// </summary>
[Authorize]
public class SeatStatusHub : Hub
{
    private readonly ILogger<SeatStatusHub> _logger;

    public SeatStatusHub(ILogger<SeatStatusHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Join the SignalR group for a specific event so the client
    /// receives real-time seat status updates for that event only.
    /// </summary>
    public async Task JoinEventRoom(string eventId)
    {
        if (string.IsNullOrWhiteSpace(eventId))
        {
            _logger.LogWarning("JoinEventRoom called with empty eventId by {ConnectionId}", Context.ConnectionId);
            return;
        }

        var groupName = $"event-{eventId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation(
            "Client {ConnectionId} (User {UserId}) joined room {Group}",
            Context.ConnectionId, Context.UserIdentifier, groupName);

        // Notify the caller they've successfully joined
        await Clients.Caller.SendAsync("JoinedEventRoom", eventId);
    }

    /// <summary>
    /// Leave the SignalR group for a specific event.
    /// Called when the user navigates away from the seat map.
    /// </summary>
    public async Task LeaveEventRoom(string eventId)
    {
        if (string.IsNullOrWhiteSpace(eventId))
        {
            _logger.LogWarning("LeaveEventRoom called with empty eventId by {ConnectionId}", Context.ConnectionId);
            return;
        }

        var groupName = $"event-{eventId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation(
            "Client {ConnectionId} (User {UserId}) left room {Group}",
            Context.ConnectionId, Context.UserIdentifier, groupName);

        await Clients.Caller.SendAsync("LeftEventRoom", eventId);
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation(
            "SignalR client connected: {ConnectionId} (User {UserId})",
            Context.ConnectionId, Context.UserIdentifier);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation(
            "SignalR client disconnected: {ConnectionId} (User {UserId}). Reason: {Reason}",
            Context.ConnectionId, Context.UserIdentifier,
            exception?.Message ?? "Normal disconnect");

        await base.OnDisconnectedAsync(exception);
    }
}
