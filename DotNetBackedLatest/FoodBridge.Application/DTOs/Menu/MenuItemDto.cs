// MenuItemDto.cs
namespace FoodBridge.Application.DTOs.Menu;

public class MenuItemDto
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public string? ImageUrl { get; set; }
    public string DietaryTag { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public bool IsFeatured { get; set; }
    public int PrepTimeMinutes { get; set; }
    public List<ItemVariantDto> Variants { get; set; } = new();
    public List<ModifierGroupDto> ModifierGroups { get; set; } = new();
}