// FoodBridge.Application/Features/Orders/Commands/CreateOrder/CreateOrderCommandHandler.cs

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
    private readonly IPricingService _pricing;

    public CreateOrderCommandHandler(
        IAppDbContext db,
        ICurrentUserService currentUser,
        IPricingService pricing)
    {
        _db = db;
        _currentUser = currentUser;
        _pricing = pricing;
    }

    public async Task<OrderDto> Handle(
        CreateOrderCommand request,
        CancellationToken ct)
    {
        // ── 1. Resolve caller identity ───────────────────────────────────────
        Guid? customerId = null;
        var userRole = _currentUser.RoleType
            ?? throw new UnauthorizedAccessException("User role not found");

        if (userRole == "Customer")
        {
            var customer = await _db.Customers
                .FirstOrDefaultAsync(c => c.UserId == request.UserId, ct)
                ?? throw new NotFoundException("Customer profile not found.");
            customerId = customer.Id;
        }
        else if (userRole == "Vendor" || userRole == "Staff")
        {
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
            else
            {
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

        // ── 2. Verify restaurant is open ─────────────────────────────────────
        var restaurantData = await _db.Restaurants
            .AsNoTracking()
            .FirstOrDefaultAsync(
                r => r.Id == request.RestaurantId
                  && r.DeletedAt == null
                  && r.IsOpen == true, ct)
            ?? throw new BadRequestException(
                "Restaurant is not available or is currently closed.");

        // ── 3. Price the order using the SAME service as CalculateCart ───────
        //
        // This is the key production guarantee: the user is charged exactly what
        // the cart preview showed. No second price calculation, no divergence.
        //
        var breakdown = await _pricing.CalculateAsync(new PriceBreakdownRequestDto
        {
            RestaurantId = request.RestaurantId,
            OrderType = request.OrderType,
            CouponCode = request.CouponCode,
            Items = request.Items.Select(i => new PriceBreakdownItemDto
            {
                MenuItemId = i.MenuItemId,
                VariantId = i.VariantId,
                ModifierOptionIds = i.Modifiers?
                    .Select(m => m.ModifierOptionId)
                    .ToList() ?? [],
                Quantity = i.Quantity,
            }).ToList(),
        }, ct);

        // ── 4. Validate minimum order (skip for staff/vendor) ────────────────
        if (userRole == "Customer" && breakdown.SubTotal < restaurantData.MinOrderAmount)
            throw new BadRequestException(
                $"Minimum order amount is ₹{restaurantData.MinOrderAmount}.");

        // ── 5. Build order items from breakdown line items ───────────────────
        //
        // PricingService already resolved prices — we just persist them.
        var menuItemIds = request.Items.Select(i => i.MenuItemId).ToList();

        var menuItems = await _db.MenuItems
            .AsNoTracking()
            .Include(i => i.Variants)
            .Where(i => menuItemIds.Contains(i.Id) && i.IsAvailable && i.DeletedAt == null)
            .ToDictionaryAsync(i => i.Id, ct);

        var orderItems = new List<OrderItem>();

        foreach (var reqItem in request.Items)
        {
            if (!menuItems.TryGetValue(reqItem.MenuItemId, out var menuItem))
                throw new BadRequestException($"Menu item '{reqItem.MenuItemId}' is not available.");

            // Use the price already computed by PricingService (via breakdown.Items)
            var lineItem = breakdown.Items.First(l => l.MenuItemId == reqItem.MenuItemId);

            var orderItem = new OrderItem
            {
                MenuItemId = menuItem.Id,
                VariantId = reqItem.VariantId,
                ItemNameSnapshot = menuItem.Name,
                Quantity = reqItem.Quantity,
                UnitPriceSnapshot = lineItem.UnitPrice,
                TotalPrice = lineItem.LineTotal,
                Notes = reqItem.Notes,
            };

            if (reqItem.Modifiers?.Any() == true)
            {
                var modifierIds = reqItem.Modifiers.Select(m => m.ModifierOptionId).ToList();

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
                        AdditionalPriceSnapshot = mod.AdditionalPrice,
                    });
                }
            }

            orderItems.Add(orderItem);
        }

        // ── 6. Increment coupon usage ────────────────────────────────────────
        if (breakdown.CouponId.HasValue)
        {
            var coupon = await _db.Coupons
                .FirstOrDefaultAsync(c => c.Id == breakdown.CouponId.Value, ct);
            if (coupon != null)
                coupon.UsageCount++;
        }

        // ── 7. Update table status for dine-in ───────────────────────────────
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

        // ── 8. Persist order with breakdown values ───────────────────────────
        var orderCode = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";
        var orderType = Enum.Parse<OrderType>(request.OrderType);

        var order = new Order
        {
            OrderCode = orderCode,
            CustomerId = customerId,
            RestaurantId = request.RestaurantId,
            OrderType = orderType,
            DeliveryAddressId = request.DeliveryAddressId,
            TableId = request.TableId,

            // ✅ All amounts come directly from PricingService output —
            //    the same object that populated the cart UI.
            SubtotalAmount = breakdown.SubTotal,
            TaxAmount = breakdown.TaxAmount,
            DeliveryFee = breakdown.DeliveryFee,
            DiscountAmount = breakdown.DiscountAmount,
            TotalAmount = breakdown.TotalAmount,

            PaymentMethod = orderType == OrderType.DineIn || orderType == OrderType.Takeaway
                ? PaymentMethod.Pending
                : Enum.Parse<PaymentMethod>(request.PaymentMethod!),
            PaymentStatus = OrderPaymentStatus.Pending,
            OrderStatus = OrderStatus.Placed,
            CouponId = breakdown.CouponId,
            CouponCodeSnapshot = breakdown.CouponCode,
            Notes = request.Notes,
            OrderItems = orderItems,
        };

        _db.Orders.Add(order);
        await _db.SaveChangesAsync(ct);

        _db.OrderStatusHistories.Add(new OrderStatusHistory
        {
            OrderId = order.Id,
            FromStatus = "None",
            ToStatus = OrderStatus.Placed.ToString(),
            ChangedByUserId = request.UserId,
            ChangedByRole = userRole,
            ChangedAt = DateTime.UtcNow,
        });
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
            CreatedAt = order.CreatedAt,
            AcceptedAt = order.AcceptedAt,
            PreparedAt = order.PreparedAt,
            ReadyAt = order.ReadyAt,
            DeliveredAt = order.DeliveredAt,
            CancelledAt = order.CancelledAt,
            RefundedAt = order.RefundedAt,
        };
    }
}