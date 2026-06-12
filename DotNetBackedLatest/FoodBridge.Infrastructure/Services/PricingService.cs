// FoodBridge.Infrastructure/Services/PricingService.cs

using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Orders;
using FoodBridge.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Infrastructure.Services;

public class PricingService : IPricingService
{
    private const decimal TaxRate = 0.05m;
    private const decimal FreeDeliveryThreshold = 299m;

    private readonly IAppDbContext _db;

    public PricingService(IAppDbContext db) => _db = db;

    public async Task<PriceBreakdownDto> CalculateAsync(
        PriceBreakdownRequestDto request,
        CancellationToken ct = default)
    {
        // ── 1. Load restaurant ──────────────────────────────────────────────
        var restaurant = await _db.Restaurants
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == request.RestaurantId && r.DeletedAt == null, ct);

        // ── 2. Bulk-load menu data (no N+1) ─────────────────────────────────
        var menuItemIds = request.Items.Select(i => i.MenuItemId).ToList();

        var variantIds = request.Items
            .Where(i => i.VariantId.HasValue)
            .Select(i => i.VariantId!.Value)
            .ToList();

        var modifierIds = request.Items
            .SelectMany(i => i.ModifierOptionIds)
            .ToList();

        var menuItems = await _db.MenuItems
            .AsNoTracking()
            .Where(i => menuItemIds.Contains(i.Id) && i.IsAvailable)
            .ToDictionaryAsync(i => i.Id, ct);

        var variants = variantIds.Count > 0
            ? await _db.ItemVariants.AsNoTracking()
                .Where(v => variantIds.Contains(v.Id))
                .ToDictionaryAsync(v => v.Id, ct)
            : new Dictionary<Guid, Domain.Entities.ItemVariant>();

        var modifierOptions = modifierIds.Count > 0
            ? await _db.ModifierOptions.AsNoTracking()
                .Where(o => modifierIds.Contains(o.Id))
                .ToDictionaryAsync(o => o.Id, ct)
            : new Dictionary<Guid, Domain.Entities.ModifierOption>();

        // ── 3. Compute line totals ───────────────────────────────────────────
        var lineItems = new List<CartLineItemDto>();
        decimal subTotal = 0;

        foreach (var item in request.Items)
        {
            if (!menuItems.TryGetValue(item.MenuItemId, out var menuItem))
                continue;

            decimal unitPrice = menuItem.BasePrice;

            if (item.VariantId.HasValue && variants.TryGetValue(item.VariantId.Value, out var variant))
                unitPrice = variant.Price;

            if (item.ModifierOptionIds.Count > 0)
                unitPrice += item.ModifierOptionIds
                    .Where(modifierOptions.ContainsKey)
                    .Sum(id => modifierOptions[id].AdditionalPrice);

            var lineTotal = unitPrice * item.Quantity;
            subTotal += lineTotal;

            lineItems.Add(new CartLineItemDto
            {
                MenuItemId = item.MenuItemId,
                Name = menuItem.Name,
                Quantity = item.Quantity,
                UnitPrice = unitPrice,
                LineTotal = lineTotal,
            });
        }

        // ── 4. Delivery fee with free-delivery threshold ─────────────────────
        decimal baseDeliveryFee = 0;
        if (request.OrderType.Equals("Delivery", StringComparison.OrdinalIgnoreCase)
            && restaurant != null)
            baseDeliveryFee = restaurant.DeliveryFee;

        bool isFreeDelivery = baseDeliveryFee == 0 || subTotal >= FreeDeliveryThreshold;
        decimal finalDeliveryFee = isFreeDelivery ? 0 : baseDeliveryFee;
        decimal amountNeeded = isFreeDelivery ? 0 : FreeDeliveryThreshold - subTotal;

        // ── 5. Tax ───────────────────────────────────────────────────────────
        decimal taxAmount = Math.Round(subTotal * TaxRate, 2);

        // ── 6. Coupon ────────────────────────────────────────────────────────
        decimal discountAmount = 0;
        Guid? couponId = null;
        string? couponMessage = null;

        if (!string.IsNullOrWhiteSpace(request.CouponCode))
        {
            var now = DateTime.UtcNow;

            var coupon = await _db.Coupons.AsNoTracking()
                .FirstOrDefaultAsync(c =>
                    c.Code == request.CouponCode &&
                    c.Status == CouponStatus.Active &&
                    (c.ExpiresAt == null || c.ExpiresAt >= now) &&
                    (c.RestaurantId == null || c.RestaurantId == request.RestaurantId), ct);

            if (coupon != null && subTotal >= coupon.MinOrderAmount)
            {
                discountAmount = coupon.CouponType == CouponType.Percentage
                    ? Math.Round(subTotal * coupon.DiscountValue / 100, 2)
                    : coupon.DiscountValue;

                if (coupon.MaxDiscountAmount.HasValue && discountAmount > coupon.MaxDiscountAmount.Value)
                    discountAmount = coupon.MaxDiscountAmount.Value;

                couponId = coupon.Id;
                couponMessage = $"Coupon applied: -{discountAmount:N2} off";
            }
            else
            {
                couponMessage = coupon is null
                    ? "Invalid or expired coupon."
                    : $"Minimum order ₹{coupon.MinOrderAmount} required.";
            }
        }

        // ── 7. Final total ───────────────────────────────────────────────────
        decimal total = subTotal + finalDeliveryFee + taxAmount - discountAmount;

        return new PriceBreakdownDto
        {
            SubTotal = subTotal,
            DeliveryFee = finalDeliveryFee,
            TaxAmount = taxAmount,
            DiscountAmount = discountAmount,
            TotalAmount = total < 0 ? 0 : total,
            CouponCode = request.CouponCode,
            CouponMessage = couponMessage,
            CouponId = couponId,
            IsFreeDelivery = isFreeDelivery,
            FreeDeliveryThreshold = FreeDeliveryThreshold,
            AmountNeededForFreeDelivery = amountNeeded,
            Items = lineItems,
        };
    }
}