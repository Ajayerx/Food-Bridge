// CancelOrderCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
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

        // Only Placed or Confirmed orders can be cancelled
        if (order.OrderStatus != OrderStatus.Placed
  && order.OrderStatus != OrderStatus.Confirmed)
            throw new BadRequestException(
                "Order cannot be cancelled at this stage.");

        // Customer can cancel their own order, Vendor/Admin can cancel any order
        var isCustomerOwner = order.Customer?.UserId == request.UserId;
        var isVendorOrAdmin = request.UserRole == "Vendor"
                           || request.UserRole == "Admin"
                           || request.UserRole == "Staff";

        if (!isCustomerOwner && !isVendorOrAdmin)
            throw new ForbiddenException(
                "You are not allowed to cancel this order.");

        order.OrderStatus = OrderStatus.Cancelled;
        order.CancelReason = request.Reason;
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}