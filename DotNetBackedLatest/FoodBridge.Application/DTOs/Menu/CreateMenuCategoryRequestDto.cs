// CreateMenuCategoryRequestDto.cs
namespace FoodBridge.Application.DTOs.Menu;

public class CreateMenuCategoryRequestDto
{
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int DisplayOrder { get; set; } = 0;
}