// GetOrderByIdQueryHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Orders;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Orders.Queries.GetOrderById;

public class GetOrderByIdQueryHandler
    : IRequestHandler<GetOrderByIdQuery, OrderDto>
{
    private readonly IAppDbContext _db;

    public GetOrderByIdQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<OrderDto> Handle(
        GetOrderByIdQuery request,
        CancellationToken ct)
    {
        var order = await _db.Orders
            .AsNoTracking()
            .Include(o => o.Restaurant)
            .Include(o => o.Customer).ThenInclude(c => c.User)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Modifiers)
            .FirstOrDefaultAsync(
                o => o.Id == request.OrderId, ct)
            ?? throw new NotFoundException("Order", request.OrderId);

        // Access check — customer can only see own orders
        if (request.RoleType == "Customer"
         && order.Customer?.UserId != request.UserId)
            throw new ForbiddenException(
                "You are not allowed to view this order.");

        return new OrderDto
        {
            Id = order.Id,
            OrderCode = order.OrderCode,
            CustomerId = order.Customer?.Id,
            CustomerName = order.Customer?.User?.FullName ?? string.Empty,
            RestaurantId = order.RestaurantId,
            RestaurantName = order.Restaurant.Name,
            OrderType = order.OrderType.ToString(),
            OrderStatus = order.OrderStatus.ToString(),
            PaymentMethod = order.PaymentMethod.ToString(),
            PaymentStatus = order.PaymentStatus.ToString(),
            SubtotalAmount = order.SubtotalAmount,
            TaxAmount = order.TaxAmount,
            DeliveryFee = order.DeliveryFee,
            DiscountAmount = order.DiscountAmount,
            TotalAmount = order.TotalAmount,
            CouponCode = order.CouponCodeSnapshot,
            Notes = order.Notes,
            CancelReason = order.CancelReason,
            DeliveryAddressId = order.DeliveryAddressId,
            TableId = order.TableId,
            CreatedAt = order.CreatedAt,
            DeliveredAt = order.DeliveredAt,
            Items = order.OrderItems.Select(oi => new OrderItemDto
            {
                Id = oi.Id,
                MenuItemId = oi.MenuItemId,
                ItemName = oi.ItemNameSnapshot,
                Quantity = oi.Quantity,
                UnitPrice = oi.UnitPriceSnapshot,
                TotalPrice = oi.TotalPrice,
                Notes = oi.Notes,
                Modifiers = oi.Modifiers.Select(m => new OrderItemModifierDto
                {
                    Id = m.Id,
                    ModifierName = m.ModifierNameSnapshot,
                    AdditionalPrice = m.AdditionalPriceSnapshot
                }).ToList()
            }).ToList()
        };
    }
}