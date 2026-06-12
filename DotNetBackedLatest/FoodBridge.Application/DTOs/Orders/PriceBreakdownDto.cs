// FoodBridge.Application/DTOs/Orders/PriceBreakdownDto.cs

namespace FoodBridge.Application.DTOs.Orders;

/// <summary>
/// Input to IPricingService.CalculateAsync — everything needed to price a cart.
/// Used by both the cart preview endpoint and order creation.
/// </summary>
public class PriceBreakdownRequestDto
{
    public Guid RestaurantId { get; set; }
    public string OrderType { get; set; } = "Delivery";   // "Delivery" | "Takeaway" | "DineIn"
    public List<PriceBreakdownItemDto> Items { get; set; } = [];
    public string? CouponCode { get; set; }
}

public class PriceBreakdownItemDto
{
    public Guid MenuItemId { get; set; }
    public Guid? VariantId { get; set; }
    public List<Guid> ModifierOptionIds { get; set; } = [];
    public int Quantity { get; set; }
}

/// <summary>
/// Authoritative price breakdown returned by IPricingService.
/// CalculateCart returns this to the UI.
/// CreateOrder saves these exact values to the Order row.
/// </summary>
public class PriceBreakdownDto
{
    public decimal SubTotal { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }

    // Coupon
    public string? CouponCode { get; set; }
    public string? CouponMessage { get; set; }
    public Guid? CouponId { get; set; }

    // Free-delivery progress  
    public bool IsFreeDelivery { get; set; }
    public decimal FreeDeliveryThreshold { get; set; }
    public decimal AmountNeededForFreeDelivery { get; set; }

    // Per-line breakdown (used by cart UI, ignored by CreateOrder)
    public List<CartLineItemDto> Items { get; set; } = [];
}