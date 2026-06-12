using Microsoft.AspNetCore.SignalR;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Infrastructure.Hubs;
using FoodBridge.Infrastructure.Persistence;
using FoodBridge.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Infrastructure.Services;

public class OrderNotificationService : IOrderNotificationService
{
    private readonly IHubContext<OrderHub> _orderHubContext;
    private readonly IHubContext<NotificationHub> _notificationHubContext;
    private readonly AppDbContext _db;
    private readonly INotificationService _notificationService;

    public OrderNotificationService(
        IHubContext<OrderHub> orderHubContext,
        IHubContext<NotificationHub> notificationHubContext,
        AppDbContext db,
        INotificationService notificationService)
    {
        _orderHubContext = orderHubContext;
        _notificationHubContext = notificationHubContext;
        _db = db;
        _notificationService = notificationService;
    }

    public async Task NotifyOrderStatusChanged(
        Guid orderId,
        string status,
        CancellationToken ct = default)
    {
        // 1. Always broadcast order status to tracking screen
        await _orderHubContext.Clients
            .Group($"order_{orderId}")
            .SendAsync("orderStatusUpdated", new { orderId, status }, ct);

        // 2. Check if this status warrants a customer notification — null means skip
        var content = GetNotificationContent(status);
        if (content is null) return;

        // 3. Get customer's UserId
        var order = await _db.Orders
            .AsNoTracking()
            .Where(o => o.Id == orderId)
            .Select(o => new {
                o.Id,
                UserId = o.Customer!.UserId
            })
            .FirstOrDefaultAsync(ct);

        if (order == null || order.UserId == Guid.Empty) return;

        var (title, body, type) = content.Value;

        // 4. Save to DB and capture the real DB Id
        var notificationId = await _notificationService.SendToUserAsync(
            order.UserId,
            title,
            body,
            new { orderId = orderId.ToString(), type = type.ToString() },
            type,
            ct);

        // 5. Push real-time via NotificationHub with the real DB Id
        await _notificationHubContext.Clients
         .Group($"user_{order.UserId}")
         .SendAsync("receivenotification", new   // ← was "receiveNotification"
         {
             id = notificationId,
             user_id = order.UserId,
             title,
             body,
             type = type.ToString(),
             is_read = false,
             created_at = DateTime.UtcNow,
         }, ct);
    }

    // Returns null for statuses that don't need a customer notification
    private static (string title, string body, NotificationType type)?
        GetNotificationContent(string status)
    {
        return status switch
        {
            "confirmed" => (
                "Order Confirmed ✅",
                "Your order has been confirmed! The restaurant is getting ready.",
                NotificationType.OrderConfirmed),

            "preparing" => (
                "Order Being Prepared 👨‍🍳",
                "Your food is being freshly prepared. Hang tight!",
                NotificationType.OrderPreparing),

            "out_for_delivery" => (
                "Out for Delivery 🛵",
                "Your order is on the way! Track it live.",
                NotificationType.OutForDelivery),

            "delivered" => (
                "Order Delivered 🎉",
                "Enjoy your meal! Don't forget to rate your experience.",
                NotificationType.OrderDelivered),

            "cancelled" => (
                "Order Cancelled ❌",
                "Your order has been cancelled.",
                NotificationType.OrderCancelled),

            // placed, preparing, ready_for_pickup, completed, refunded
            // are internal states — skip customer notification
            _ => null
        };
    }
}