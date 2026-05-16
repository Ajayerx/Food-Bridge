using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Orders;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Orders.Queries.CalculateCart;




public class CalculateCartQueryHandler : IRequestHandler<CalculateCartQuery, CartCalculateResponseDto>
{
    private readonly IAppDbContext _db;
    public CalculateCartQueryHandler(IAppDbContext db) => _db = db;

    public async Task<CartCalculateResponseDto> Handle(CalculateCartQuery request, CancellationToken ct)
    {
        var restaurant = await _db.Restaurants.AsNoTracking()
    .FirstOrDefaultAsync(r => r.Id == request.RestaurantId && r.DeletedAt == null, ct);

        // ✅ Bulk fetch everything upfront — no more N+1 queries
        var menuItemIds = request.Items.Select(i => i.MenuItemId).ToList();
        var variantIds = request.Items
            .Where(i => i.VariantId.HasValue)
            .Select(i => i.VariantId!.Value)
            .ToList();
        var modifierIds = request.Items
            .SelectMany(i => i.ModifierOptionIds)
            .ToList();

        var menuItems = await _db.MenuItems.AsNoTracking()
            .Where(i => menuItemIds.Contains(i.Id) && i.IsAvailable)
            .ToDictionaryAsync(i => i.Id, ct);

        var variants = variantIds.Any()
            ? await _db.ItemVariants.AsNoTracking()
                .Where(v => variantIds.Contains(v.Id))
                .ToDictionaryAsync(v => v.Id, ct)
            : new Dictionary<Guid, FoodBridge.Domain.Entities.ItemVariant>();

        var modifierOptions = modifierIds.Any()
            ? await _db.ModifierOptions.AsNoTracking()
                .Where(o => modifierIds.Contains(o.Id))
                .ToDictionaryAsync(o => o.Id, ct)
            : new Dictionary<Guid, FoodBridge.Domain.Entities.ModifierOption>();

        // ✅ Process in memory — zero additional DB calls
        var lineItems = new List<CartLineItemDto>();
        decimal subTotal = 0;

        foreach (var cartItem in request.Items)
        {
            if (!menuItems.TryGetValue(cartItem.MenuItemId, out var menuItem)) continue;

            decimal unitPrice = menuItem.BasePrice;

            if (cartItem.VariantId.HasValue && variants.TryGetValue(cartItem.VariantId.Value, out var variant))
                unitPrice = variant.Price;

            if (cartItem.ModifierOptionIds.Any())
                unitPrice += cartItem.ModifierOptionIds
                    .Where(modifierOptions.ContainsKey)
                    .Sum(id => modifierOptions[id].AdditionalPrice);

            var lineTotal = unitPrice * cartItem.Quantity;
            subTotal += lineTotal;

            lineItems.Add(new CartLineItemDto
            {
                MenuItemId = cartItem.MenuItemId,
                Name = menuItem.Name,
                Quantity = cartItem.Quantity,
                UnitPrice = unitPrice,
                LineTotal = lineTotal
            });
        }

        decimal deliveryFee = 0;
        if (request.OrderType.Equals("Delivery", StringComparison.OrdinalIgnoreCase) && restaurant != null)
            deliveryFee = restaurant.DeliveryFee;

        decimal taxAmount = Math.Round(subTotal * 0.05m, 2);
        decimal discountAmount = 0;
        string? couponMessage = null;

        if (!string.IsNullOrWhiteSpace(request.CouponCode))
        {
            var now = DateTime.UtcNow;
            var coupon = await _db.Coupons.AsNoTracking()
                .FirstOrDefaultAsync(c =>
                    c.Code == request.CouponCode &&
                    c.Status == CouponStatus.Active &&
                    (c.ExpiresAt == null || c.ExpiresAt >= now), ct);

            if (coupon != null && subTotal >= coupon.MinOrderAmount)
            {
                discountAmount = coupon.CouponType == CouponType.Percentage
                    ? Math.Round(subTotal * coupon.DiscountValue / 100, 2)
                    : coupon.DiscountValue;

                if (coupon.MaxDiscountAmount.HasValue && discountAmount > coupon.MaxDiscountAmount.Value)
                    discountAmount = coupon.MaxDiscountAmount.Value;

                couponMessage = $"Coupon applied: -{discountAmount:N2} off";
            }
            else
            {
                couponMessage = coupon is null
                    ? "Invalid or expired coupon."
                    : $"Minimum order ₹{coupon.MinOrderAmount} required.";
            }
        }

        var total = subTotal + deliveryFee + taxAmount - discountAmount;

        const decimal freeDeliveryThreshold = 299m;
        bool isFreeDelivery = deliveryFee == 0 || subTotal >= freeDeliveryThreshold;
        decimal amountNeeded = isFreeDelivery ? 0 : freeDeliveryThreshold - subTotal;
        decimal finalDeliveryFee = isFreeDelivery ? 0 : deliveryFee;
        decimal finalTotal = subTotal + finalDeliveryFee + taxAmount - discountAmount;

        return new CartCalculateResponseDto
        {
            SubTotal = subTotal,
            DeliveryFee = finalDeliveryFee,
            TaxAmount = taxAmount,
            DiscountAmount = discountAmount,
            TotalAmount = finalTotal < 0 ? 0 : finalTotal,
            CouponCode = request.CouponCode,
            CouponMessage = couponMessage,
            Items = lineItems,
            IsFreeDelivery = isFreeDelivery,
            FreeDeliveryThreshold = freeDeliveryThreshold,
            AmountNeededForFreeDelivery = amountNeeded
        };
    }
}