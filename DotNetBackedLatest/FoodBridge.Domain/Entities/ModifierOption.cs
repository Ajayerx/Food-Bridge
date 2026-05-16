using FoodBridge.Domain.Common;

namespace FoodBridge.Domain.Entities;

public class ModifierOption : BaseEntity
{
    public Guid ModifierGroupId { get; set; }
    public ModifierGroup ModifierGroup { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public decimal AdditionalPrice { get; set; } = 0;
    public bool IsAvailable { get; set; } = true;
}
