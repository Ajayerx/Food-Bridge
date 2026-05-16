using FoodBridge.Domain.Common;

namespace FoodBridge.Domain.Entities;

public class OrderItemModifier : CreatedOnlyEntity
{
    public Guid OrderItemId { get; set; }
    public OrderItem OrderItem { get; set; } = null!;
    public Guid ModifierOptionId { get; set; }
    public ModifierOption ModifierOption { get; set; } = null!;
    public string ModifierNameSnapshot { get; set; } = string.Empty;
    public decimal AdditionalPriceSnapshot { get; set; } = 0;
}
