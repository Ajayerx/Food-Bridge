// CreateOrderCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Orders;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Orders.Commands.CreateOrder;

public class CreateOrderCommandHandler
    : IRequestHandler<CreateOrderCommand, OrderDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CreateOrderCommandHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<OrderDto> Handle(
        CreateOrderCommand request,
        CancellationToken ct)
    {
        // ✅ 1. Determine if this is a customer order or staff/vendor order
        Guid? customerId = null;
        var userRole = _currentUser.RoleType ?? throw new UnauthorizedAccessException("User role not found");

        if (userRole == "Customer")
        {
            // Customer placing their own order
            var customer = await _db.Customers
                .FirstOrDefaultAsync(c => c.UserId == request.UserId, ct)
                ?? throw new NotFoundException("Customer profile not found.");
            customerId = customer.Id;
        }
        else if (userRole == "Vendor" || userRole == "Staff")
        {
            // ✅ Vendor/Staff creating order on behalf of walk-in customer
            // customerId remains null - this is a manual order

            // Verify access to restaurant
            var restaurant = await _db.Restaurants
                .FirstOrDefaultAsync(r => r.Id == request.RestaurantId, ct)
                ?? throw new NotFoundException("Restaurant not found");

            if (userRole == "Vendor")
            {
                var vendor = await _db.Vendors
                    .FirstOrDefaultAsync(v => v.UserId == request.UserId, ct)
                    ?? throw new NotFoundException("Vendor profile not found.");

                if (restaurant.VendorId != vendor.Id)
                    throw new UnauthorizedAccessException("You don't own this restaurant");
            }
            else if (userRole == "Staff")
            {
                // ✅ Staff must work at this restaurant - using StaffUsers DbSet
                var staffMember = await _db.StaffUsers
                    .FirstOrDefaultAsync(s =>
                        s.UserId == request.UserId &&
                        s.RestaurantId == request.RestaurantId &&
                        s.IsActive == true, ct);

                if (staffMember == null)
                    throw new UnauthorizedAccessException("You don't have access to this restaurant");
            }
        }
        else
        {
            throw new UnauthorizedAccessException("Invalid user role");
        }

        // ✅ 2. Get restaurant
        var restaurantData = await _db.Restaurants
            .AsNoTracking()
            .FirstOrDefaultAsync(
                r => r.Id == request.RestaurantId
                  && r.DeletedAt == null
                  && r.IsOpen == true, ct)
            ?? throw new BadRequestException(
                "Restaurant is not available or is currently closed.");

        // ✅ 3. Validate and get menu items
        var itemIds = request.Items
            .Select(i => i.MenuItemId).ToList();

        var menuItems = await _db.MenuItems
            .AsNoTracking()
            .Include(i => i.Variants)
            .Where(i => itemIds.Contains(i.Id)
                     && i.IsAvailable
                     && i.DeletedAt == null)
            .ToDictionaryAsync(i => i.Id, ct);

        // ✅ 4. Build order items & calculate totals
        decimal subtotal = 0;
        var orderItems = new List<OrderItem>();

        foreach (var reqItem in request.Items)
        {
            if (!menuItems.TryGetValue(reqItem.MenuItemId, out var menuItem))
                throw new BadRequestException(
                    $"Menu item '{reqItem.MenuItemId}' is not available.");

            var unitPrice = reqItem.VariantId.HasValue
                ? menuItem.Variants
                    .FirstOrDefault(v => v.Id == reqItem.VariantId)?.Price
                    ?? throw new BadRequestException("Variant not found.")
                : menuItem.BasePrice;

            var lineTotal = unitPrice * reqItem.Quantity;
            subtotal += lineTotal;

            var orderItem = new OrderItem
            {
                MenuItemId = menuItem.Id,
                VariantId = reqItem.VariantId,
                ItemNameSnapshot = menuItem.Name,
                Quantity = reqItem.Quantity,
                UnitPriceSnapshot = unitPrice,
                TotalPrice = lineTotal,
                Notes = reqItem.Notes
            };

            // Add modifiers
            if (reqItem.Modifiers?.Any() == true)
            {
                var modifierIds = reqItem.Modifiers
                    .Select(m => m.ModifierOptionId).ToList();

                var modifierOptions = await _db.ModifierOptions
                    .AsNoTracking()
                    .Where(o => modifierIds.Contains(o.Id))
                    .ToListAsync(ct);

                foreach (var mod in modifierOptions)
                {
                    orderItem.Modifiers.Add(new OrderItemModifier
                    {
                        ModifierOptionId = mod.Id,
                        ModifierNameSnapshot = mod.Name,
                        AdditionalPriceSnapshot = mod.AdditionalPrice
                    });
                    lineTotal += mod.AdditionalPrice * reqItem.Quantity;
                }
                orderItem.TotalPrice = lineTotal;
                subtotal = orderItems.Sum(oi => oi.TotalPrice) + lineTotal;
            }

            orderItems.Add(orderItem);
        }

        // ✅ 5. Validate min order amount (skip for staff/vendor manual orders)
        if (userRole == "Customer" && subtotal < restaurantData.MinOrderAmount)
            throw new BadRequestException(
                $"Minimum order amount is ₹{restaurantData.MinOrderAmount}.");

        // ✅ 6. Apply coupon if provided
        decimal discountAmount = 0;
        Coupon? coupon = null;

        if (!string.IsNullOrEmpty(request.CouponCode))
        {
            coupon = await _db.Coupons
                .FirstOrDefaultAsync(
                    c => c.Code == request.CouponCode
                      && c.Status == CouponStatus.Active
                      && (c.ExpiresAt == null || c.ExpiresAt > DateTime.UtcNow)
                      && (c.RestaurantId == null || c.RestaurantId == request.RestaurantId), ct);

            if (coupon is not null)
            {
                discountAmount = coupon.CouponType == CouponType.Percentage
                    ? Math.Min(subtotal * coupon.DiscountValue / 100,
                        coupon.MaxDiscountAmount ?? decimal.MaxValue)
                    : coupon.DiscountValue;

                coupon.UsageCount++;
            }
        }

        // ✅ 7. Calculate final totals
        const decimal taxRate = 0.05m;
        var taxAmount = Math.Round(subtotal * taxRate, 2);
        var deliveryFee = request.OrderType == "Delivery"
                                    ? restaurantData.DeliveryFee : 0;
        var total = subtotal + taxAmount + deliveryFee - discountAmount;

        // ✅ 8. Update table status for dine-in orders - using RestaurantTables DbSet
        if (request.OrderType == "DineIn" && request.TableId.HasValue)
        {
            var table = await _db.RestaurantTables
                .FirstOrDefaultAsync(t => t.Id == request.TableId.Value, ct);

            if (table != null)
            {
                table.Status = TableStatus.Occupied;
                table.UpdatedAt = DateTime.UtcNow;
            }
        }

        // ✅ 9. Create order
        // ✅ 9. Create order
        var orderCode = $"ORD-{DateTime.UtcNow:yyyyMMdd}-" +
                        $"{new Random().Next(1000, 9999)}";

        var orderType = Enum.Parse<OrderType>(request.OrderType);

        var order = new Order
        {
            OrderCode = orderCode,
            CustomerId = customerId,
            RestaurantId = request.RestaurantId,
            OrderType = orderType,
            DeliveryAddressId = request.DeliveryAddressId,
            TableId = request.TableId,
            SubtotalAmount = subtotal,
            TaxAmount = taxAmount,
            DeliveryFee = deliveryFee,
            DiscountAmount = discountAmount,
            TotalAmount = total,

            // ✅ DineIn/Takeaway: payment decided at billing time
            // Delivery: must provide payment method upfront
            PaymentMethod = orderType == OrderType.DineIn || orderType == OrderType.Takeaway
                ? PaymentMethod.Pending
                : Enum.Parse<PaymentMethod>(request.PaymentMethod!),

            PaymentStatus = OrderPaymentStatus.Pending,
            OrderStatus = OrderStatus.Placed,
            CouponId = coupon?.Id,
            CouponCodeSnapshot = coupon?.Code,
            Notes = request.Notes,
            OrderItems = orderItems
        };
        _db.Orders.Add(order);
        await _db.SaveChangesAsync(ct);

        return new OrderDto
        {
            Id = order.Id,
            OrderCode = order.OrderCode,
            CustomerId = customerId,
            RestaurantId = order.RestaurantId,
            RestaurantName = restaurantData.Name,
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
            CreatedAt = order.CreatedAt
        };
    }
}


