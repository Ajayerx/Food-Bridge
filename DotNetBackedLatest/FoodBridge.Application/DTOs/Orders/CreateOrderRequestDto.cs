// CreateOrderRequestDto.cs
namespace FoodBridge.Application.DTOs.Orders;

public class CreateOrderRequestDto
{
    public Guid RestaurantId { get; set; }
    public string OrderType { get; set; } = string.Empty;
    public Guid? DeliveryAddressId { get; set; }
    public Guid? TableId { get; set; }
    public List<OrderItemRequestDto> Items { get; set; } = new();
    public string? CouponCode { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? Notes { get; set; }
}