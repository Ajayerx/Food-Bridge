// MenuCategoryDto.cs
namespace FoodBridge.Application.DTOs.Menu;

public class MenuCategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public List<MenuItemDto> Items { get; set; } = new();
}