using FoodBridge.Domain.Common;

namespace FoodBridge.Domain.Entities;

public class OrderItem : CreatedOnlyEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public Guid MenuItemId { get; set; }
    public MenuItem MenuItem { get; set; } = null!;
    public Guid? VariantId { get; set; }
    public ItemVariant? Variant { get; set; }
    public string ItemNameSnapshot { get; set; } = string.Empty;
    public decimal UnitPriceSnapshot { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Notes { get; set; }

    public ICollection<OrderItemModifier> Modifiers { get; set; } = new List<OrderItemModifier>();
}
