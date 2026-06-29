// FoodBridge.Infrastructure/Hubs/NotificationHub.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FoodBridge.Infrastructure.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        // Each user joins their own personal group
        // Group name: "user_{userId}" — matches what OrderNotificationService sends to
        var userId = Context.UserIdentifier;
        if (userId != null)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Delivery agents call this to receive broadcast dispatch offers.
    /// </summary>
    public async Task JoinDispatchGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "delivery_agents");
    }

    /// <summary>
    /// Delivery agents call this when they no longer want dispatch broadcasts.
    /// </summary>
    public async Task LeaveDispatchGroup()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "delivery_agents");
    }
}