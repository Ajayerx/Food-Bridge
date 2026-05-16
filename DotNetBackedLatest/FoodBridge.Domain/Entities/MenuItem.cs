using FoodBridge.Domain.Common;
using FoodBridge.Domain.Enums;

namespace FoodBridge.Domain.Entities;

public class MenuItem : SoftDeleteEntity
{
    public Guid CategoryId { get; set; }
    public MenuCategory Category { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public string? ImageUrl { get; set; }
    public DietaryTag DietaryTag { get; set; } = DietaryTag.Veg;
    public bool IsAvailable { get; set; } = true;
    public bool IsFeatured { get; set; } = false;
    public int PrepTimeMinutes { get; set; } = 15;

    public ICollection<ItemVariant> Variants { get; set; } = new List<ItemVariant>();
    public ICollection<ModifierGroup> ModifierGroups { get; set; } = new List<ModifierGroup>();
}
