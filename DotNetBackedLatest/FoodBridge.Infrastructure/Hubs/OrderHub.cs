using Microsoft.AspNetCore.SignalR;

namespace FoodBridge.Infrastructure.Hubs;

public class OrderHub : Hub
{
    public async Task JoinOrderRoom(string orderId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"order_{orderId}");
    }

    public async Task LeaveOrderRoom(string orderId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"order_{orderId}");
    }
}