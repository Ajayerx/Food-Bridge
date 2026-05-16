// CreateMenuItemRequestDto.cs
namespace FoodBridge.Application.DTOs.Menu;

public class CreateMenuItemRequestDto
{
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public string? ImageUrl { get; set; }
    public string DietaryTag { get; set; } = "Veg";
    public int PrepTimeMinutes { get; set; } = 15;
}