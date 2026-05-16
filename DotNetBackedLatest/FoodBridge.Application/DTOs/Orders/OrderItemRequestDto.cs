// OrderItemRequestDto.cs
namespace FoodBridge.Application.DTOs.Orders;

public class OrderItemRequestDto
{
    public Guid MenuItemId { get; set; }
    public Guid? VariantId { get; set; }
    public int Quantity { get; set; }
    public List<OrderModifierRequestDto> Modifiers { get; set; } = new();
    public string? Notes { get; set; }
}