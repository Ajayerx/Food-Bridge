using FoodBridge.Domain.Common;

namespace FoodBridge.Domain.Entities;

public class ModifierGroup : BaseEntity
{
    public Guid MenuItemId { get; set; }
    public Guid RestaurantId { get; set; }
    public MenuItem MenuItem { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public bool IsRequired { get; set; } = false;
    public int MaxSelections { get; set; } = 1;
    public Restaurant Restaurant { get; set; } = null!; 
    public ICollection<ModifierOption> Options { get; set; } = new List<ModifierOption>();
}
