// GetOrdersQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Orders;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Orders.Queries.GetOrders;

public class GetOrdersQueryHandler
    : IRequestHandler<GetOrdersQuery, List<OrderDto>>
{
    private readonly IAppDbContext _db;

    public GetOrdersQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<List<OrderDto>> Handle(
        GetOrdersQuery request,
        CancellationToken ct)
    {
        var query = _db.Orders
            .AsNoTracking()
            .Include(o => o.Restaurant)
            .Include(o => o.Customer).ThenInclude(c => c!.User)
            .Include(o => o.Table)                                  
            .Include(o => o.OrderItems).ThenInclude(i => i.Variant)
            .AsQueryable();

        // Role-based filtering
        switch (request.RoleType)
        {
            case "Customer":
                var customer = await _db.Customers
                    .FirstOrDefaultAsync(
                        c => c.UserId == request.UserId, ct);
                if (customer is not null)
                    query = query.Where(
                        o => o.CustomerId == customer.Id);
                break;

            case "Vendor":
                var vendor = await _db.Vendors
                    .FirstOrDefaultAsync(v => v.UserId == request.UserId, ct);
                if (vendor is not null)
                {
                    if (request.RestaurantId.HasValue)
                        // Show only the selected restaurant's orders
                        query = query.Where(o => o.RestaurantId == request.RestaurantId);
                    else
                        // No restaurant selected — show all vendor's restaurants
                        query = query.Where(o => o.Restaurant.VendorId == vendor.Id);
                }
                break;

            case "Staff":
                if (request.RestaurantId.HasValue)
                    query = query.Where(o => o.RestaurantId == request.RestaurantId);
                else
                    query = query.Where(o => o.Id == Guid.Empty); // return nothing if no restaurant
                break;
        }

        // Filter by restaurant
        if (request.RestaurantId.HasValue
         && request.RoleType == "Admin")
            query = query.Where(
                o => o.RestaurantId == request.RestaurantId);

        // Filter by status
        if (!string.IsNullOrEmpty(request.Status)
         && Enum.TryParse<OrderStatus>(request.Status, out var status))
            query = query.Where(o => o.OrderStatus == status);

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        // GetOrdersQueryHandler.cs - fix the Select() mapping

        return orders.Select(o => new OrderDto
        {
            Id = o.Id,
            OrderCode = o.OrderCode,
            CustomerId = o.Customer?.Id,
            CustomerName = o.Customer?.User?.FullName ?? string.Empty,    
            RestaurantId = o.RestaurantId,
            RestaurantName = o.Restaurant?.Name ?? string.Empty,
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
            Notes = o.Notes,
            CancelReason = o.CancelReason,
            TableId = o.TableId,
            TableName = o.Table?.TableNumber ?? null,
            DeliveryAgentId = o.DeliveryAgentId,
            CreatedAt = o.CreatedAt,
            DeliveredAt = o.DeliveredAt,
            Items = o.OrderItems.Select(i => new OrderItemDto
            {
                Id = i.Id,
                MenuItemId = i.MenuItemId,
                ItemName = i.ItemNameSnapshot,
                VariantName = i.Variant?.Name ?? null,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPriceSnapshot,
                TotalPrice = i.TotalPrice,
                Notes = i.Notes,
            }).ToList()
        }).ToList();
    }
}