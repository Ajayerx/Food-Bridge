// GetOrderHistoryQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Orders;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Orders.Queries.GetOrderHistory;

public class GetOrderHistoryQueryHandler
    : IRequestHandler<GetOrderHistoryQuery, List<OrderDto>>
{
    private readonly IAppDbContext _db;

    public GetOrderHistoryQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<List<OrderDto>> Handle(
        GetOrderHistoryQuery request,
        CancellationToken ct)
    {
        var customer = await _db.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.UserId == request.UserId, ct);

        if (customer is null)
            return new List<OrderDto>();

        // Only completed or cancelled orders
        var completedStatuses = new[]
        {
            OrderStatus.Delivered,
            OrderStatus.Cancelled,
            OrderStatus.Refunded
        };

        var orders = await _db.Orders
            .AsNoTracking()
            .Include(o => o.Restaurant)
            .Include(o => o.OrderItems)
            .Where(o => o.CustomerId == customer.Id
                     && completedStatuses.Contains(o.OrderStatus))
            .OrderByDescending(o => o.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        return orders.Select(o => new OrderDto
        {
            Id = o.Id,
            OrderCode = o.OrderCode,
            CustomerId = customer.Id,
            RestaurantId = o.RestaurantId,
            RestaurantName = o.Restaurant.Name,
            OrderType = o.OrderType.ToString(),
            OrderStatus = o.OrderStatus.ToString(),
            PaymentMethod = o.PaymentMethod.ToString(),
            PaymentStatus = o.PaymentStatus.ToString(),
            SubtotalAmount = o.SubtotalAmount,
            TaxAmount = o.TaxAmount,
            DeliveryFee = o.DeliveryFee,
            DiscountAmount = o.DiscountAmount,
            TotalAmount = o.TotalAmount,
            CouponCode = o.CouponCodeSnapshot,
            CreatedAt = o.CreatedAt,
            DeliveredAt = o.DeliveredAt,
            Items = o.OrderItems.Select(oi => new OrderItemDto
            {
                Id = oi.Id,
                MenuItemId = oi.MenuItemId,
                ItemName = oi.ItemNameSnapshot,
                Quantity = oi.Quantity,
                UnitPrice = oi.UnitPriceSnapshot,
                TotalPrice = oi.TotalPrice,
                Notes = oi.Notes
            }).ToList()
        }).ToList();
    }
}