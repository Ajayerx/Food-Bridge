using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.Features.Orders.Commands.AssignDeliveryAgent;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Orders.Commands.UpdateOrderStatus;

public class UpdateOrderStatusCommandHandler
    : IRequestHandler<UpdateOrderStatusCommand, Unit>
{
    private readonly IAppDbContext _db;
    private readonly IMediator _mediator;
    private readonly IOrderNotificationService _notifications; // ✅ added

    public UpdateOrderStatusCommandHandler(
        IAppDbContext db,
        IMediator mediator,
        IOrderNotificationService notifications)  // ✅ injected
    {
        _db = db;
        _mediator = mediator;
        _notifications = notifications;
    }

    public async Task<Unit> Handle(
        UpdateOrderStatusCommand request,
        CancellationToken ct)
    {
        var order = await _db.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, ct)
            ?? throw new NotFoundException("Order", request.OrderId);

        var newStatus = Enum.Parse<OrderStatus>(request.Status);

        if (newStatus == OrderStatus.Delivered)
            order.MarkAsDelivered();
        else if (newStatus == OrderStatus.Completed)
            order.MarkAsCompleted();
        else
            order.OrderStatus = newStatus;

        order.UpdatedAt = DateTime.UtcNow;

        if (order.OrderStatus == OrderStatus.Cancelled)
            order.CancelReason = request.Reason;

        // ── Free table on Completed or Cancelled ──────────
        if ((order.OrderStatus == OrderStatus.Completed
             || order.OrderStatus == OrderStatus.Cancelled)
            && order.OrderType == OrderType.DineIn
            && order.TableId.HasValue)
        {
            var table = await _db.RestaurantTables
                .FirstOrDefaultAsync(t => t.Id == order.TableId.Value, ct);

            if (table != null)
            {
                table.Status = TableStatus.Available;
                table.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync(ct);

        // ✅ Broadcast status update via SignalR
        // order.OrderStatus.ToString() gives 'OutForDelivery', 'ReadyForPickup' etc.
        // snake_case_lower serializer doesn't apply here — we're calling ToString() manually
        // So convert to snake_case manually to match STATUS_MAP keys on frontend
        var statusString = order.OrderStatus switch
        {
            OrderStatus.Placed => "placed",
            OrderStatus.Confirmed => "confirmed",
            OrderStatus.Preparing => "preparing",
            OrderStatus.ReadyForPickup => "ready_for_pickup",
            OrderStatus.OutForDelivery => "out_for_delivery",
            OrderStatus.Delivered => "delivered",
            OrderStatus.Completed => "completed",
            OrderStatus.Cancelled => "cancelled",
            OrderStatus.Refunded => "refunded",
            _ => order.OrderStatus.ToString().ToLower()
        };

        await _notifications.NotifyOrderStatusChanged(order.Id, statusString, ct);

        // ── Auto-assign delivery agent ─────────────────────
        if (order.OrderStatus == OrderStatus.ReadyForPickup
            && order.OrderType == OrderType.Delivery
            && order.DeliveryAgentId == null)
        {
            try
            {
                await _mediator.Send(
                    new AssignDeliveryAgentCommand(order.Id, null), ct);
            }
            catch (Exception ex) { _ = ex; }
        }

        return Unit.Value;
    }
}