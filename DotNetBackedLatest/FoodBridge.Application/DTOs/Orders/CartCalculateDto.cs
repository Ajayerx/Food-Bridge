namespace FoodBridge.Application.DTOs.Orders;

public class CartCalculateRequestDto
{
    public Guid RestaurantId { get; set; }
    public List<CartItemDto> Items { get; set; } = new();
    public string? CouponCode { get; set; }
    public Guid? DeliveryAddressId { get; set; }
    public string OrderType { get; set; } = "Delivery";
}

public class CartItemDto
{
    public Guid MenuItemId { get; set; }
    public Guid? VariantId { get; set; }
    public int Quantity { get; set; }
    public List<Guid> ModifierOptionIds { get; set; } = new();
}

public class CartCalculateResponseDto
{
    public decimal SubTotal { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? CouponCode { get; set; }
    public string? CouponMessage { get; set; }
    public List<CartLineItemDto> Items { get; set; } = new();

    // ✅ Free delivery fields
    public bool IsFreeDelivery { get; set; }
    public decimal FreeDeliveryThreshold { get; set; }
    public decimal AmountNeededForFreeDelivery { get; set; }
}

public class CartLineItemDto
{
    public Guid MenuItemId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}
