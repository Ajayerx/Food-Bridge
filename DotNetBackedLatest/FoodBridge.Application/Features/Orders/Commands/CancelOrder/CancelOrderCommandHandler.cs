using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Orders.Commands.CancelOrder;

public class CancelOrderCommandHandler
    : IRequestHandler<CancelOrderCommand, Unit>
{
    private readonly IAppDbContext _db;

    public CancelOrderCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        CancelOrderCommand request,
        CancellationToken ct)
    {
        var order = await _db.Orders
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(
                o => o.Id == request.OrderId, ct)
            ?? throw new NotFoundException("Order", request.OrderId);

        if (order.OrderStatus != OrderStatus.Placed
            && order.OrderStatus != OrderStatus.Confirmed)
            throw new BadRequestException(
                "Order cannot be cancelled at this stage.");

        var isCustomerOwner = order.Customer?.UserId == request.UserId;
        var isVendorOrAdmin = request.UserRole == "Vendor"
                           || request.UserRole == "Admin"
                           || request.UserRole == "Staff";

        if (!isCustomerOwner && !isVendorOrAdmin)
            throw new ForbiddenException(
                "You are not allowed to cancel this order.");

        var oldStatus = order.OrderStatus.ToString();
        order.MarkAsCancelled(request.Reason);
        order.UpdatedAt = DateTime.UtcNow;

        _db.OrderStatusHistories.Add(new OrderStatusHistory
        {
            OrderId = order.Id,
            FromStatus = oldStatus,
            ToStatus = OrderStatus.Cancelled.ToString(),
            ChangedByUserId = request.UserId,
            ChangedByRole = request.UserRole,
            Reason = request.Reason,
            ChangedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}