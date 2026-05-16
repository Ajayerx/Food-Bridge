using FoodBridge.Domain.Common;

namespace FoodBridge.Domain.Entities;

public class ItemVariant : BaseEntity
{
    public Guid MenuItemId { get; set; }
    public MenuItem MenuItem { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; } = true;
}
