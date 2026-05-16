// UpdateMenuItemRequestDto.cs
namespace FoodBridge.Application.DTOs.Menu;

public class UpdateMenuItemRequestDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public decimal? BasePrice { get; set; }
    public string? ImageUrl { get; set; }
    public string? DietaryTag { get; set; }
    public bool? IsAvailable { get; set; }
    public bool? IsFeatured { get; set; }
    public int? PrepTimeMinutes { get; set; }
}