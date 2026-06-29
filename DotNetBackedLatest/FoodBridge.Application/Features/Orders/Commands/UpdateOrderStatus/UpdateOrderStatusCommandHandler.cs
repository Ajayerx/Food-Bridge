using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.Features.Dispatch.Commands.CreateAndBroadcastDispatchOffer;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Orders.Commands.UpdateOrderStatus;

public class UpdateOrderStatusCommandHandler
    : IRequestHandler<UpdateOrderStatusCommand, Unit>
{
    private static readonly Dictionary<OrderStatus, OrderStatus[]> ValidTransitions = new()
    {
        [OrderStatus.Placed] = new[] { OrderStatus.Confirmed, OrderStatus.Cancelled },
        [OrderStatus.Confirmed] = new[] { OrderStatus.Preparing, OrderStatus.Cancelled },
        [OrderStatus.Preparing] = new[] { OrderStatus.ReadyForPickup, OrderStatus.Cancelled },
        [OrderStatus.ReadyForPickup] = new[] { OrderStatus.OutForDelivery, OrderStatus.Completed, OrderStatus.Cancelled },
        [OrderStatus.OutForDelivery] = new[] { OrderStatus.Delivered },
        [OrderStatus.Delivered] = new[] { OrderStatus.Completed },
        [OrderStatus.Completed] = Array.Empty<OrderStatus>(),
        [OrderStatus.Cancelled] = new[] { OrderStatus.Refunded },
        [OrderStatus.Refunded] = Array.Empty<OrderStatus>(),
    };

    private readonly IAppDbContext _db;
    private readonly IMediator _mediator;
    private readonly IOrderNotificationService _notifications;

    public UpdateOrderStatusCommandHandler(
        IAppDbContext db,
        IMediator mediator,
        IOrderNotificationService notifications)
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
        var oldStatus = order.OrderStatus;

        // ── State machine validation ─────────────────────────
        if (!ValidTransitions.TryGetValue(oldStatus, out var allowedNext)
            || !allowedNext.Contains(newStatus))
        {
            throw new BadRequestException(
                $"Cannot transition from {oldStatus} to {newStatus}.");
        }

        // ── Apply status change via domain methods ────────────
        var oldStatusString = order.OrderStatus.ToString();

        switch (newStatus)
        {
            case OrderStatus.Confirmed:
                order.MarkAsAccepted();
                break;
            case OrderStatus.Preparing:
                order.MarkAsPreparing();
                break;
            case OrderStatus.ReadyForPickup:
                order.MarkAsReady();
                break;
            case OrderStatus.Delivered:
                order.MarkAsDelivered();
                break;
            case OrderStatus.Completed:
                order.MarkAsCompleted();
                break;
            case OrderStatus.Cancelled:
                order.MarkAsCancelled(request.Reason);
                break;
            case OrderStatus.Refunded:
                order.MarkAsRefunded();
                break;
            default:
                order.OrderStatus = newStatus;
                break;
        }

        order.UpdatedAt = DateTime.UtcNow;

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

        // ── Log status history ────────────────────────────────
        _db.OrderStatusHistories.Add(new OrderStatusHistory
        {
            OrderId = order.Id,
            FromStatus = oldStatusString,
            ToStatus = order.OrderStatus.ToString(),
            ChangedByUserId = request.UserId,
            Reason = request.Reason,
            ChangedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);

        // ── Broadcast status update via SignalR ──────────────
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

        // ── Broadcast dispatch offer (instead of greedy auto-assign) ──
        if (order.OrderStatus == OrderStatus.ReadyForPickup
            && order.OrderType == OrderType.Delivery
            && order.DeliveryAgentId == null)
        {
            try
            {
                await _mediator.Send(
                    new CreateAndBroadcastDispatchOfferCommand(order.Id), ct);
            }
            catch (Exception ex) { _ = ex; }
        }

        return Unit.Value;
    }
}