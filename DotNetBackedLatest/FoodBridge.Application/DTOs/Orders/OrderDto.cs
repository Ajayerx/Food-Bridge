// OrderDto.cs
namespace FoodBridge.Application.DTOs.Orders;

public class OrderDto
{
    public Guid Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public Guid? CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public Guid RestaurantId { get; set; }
    public string RestaurantName { get; set; } = string.Empty;
    public string OrderType { get; set; } = string.Empty;
    public string OrderStatus { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public decimal SubtotalAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? CouponCode { get; set; }
    public string? Notes { get; set; }
    public string? CancelReason { get; set; }
    public Guid? DeliveryAddressId { get; set; }
    public string? TableName { get; set; }
    public Guid? TableId { get; set; }
    public Guid? DeliveryAgentId { get; set; }
    public string? AgentName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}

public class OrderItemDto
{
    public Guid Id { get; set; }
    public Guid MenuItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? VariantName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Notes { get; set; }
    public List<OrderItemModifierDto> Modifiers { get; set; } = new();
}

public class OrderItemModifierDto
{
    public Guid Id { get; set; }
    public string ModifierName { get; set; } = string.Empty;
    public decimal AdditionalPrice { get; set; }
}