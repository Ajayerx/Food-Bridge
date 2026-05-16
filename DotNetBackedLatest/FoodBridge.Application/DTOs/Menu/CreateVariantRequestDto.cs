// CreateVariantRequestDto.cs
namespace FoodBridge.Application.DTOs.Menu;

public class CreateVariantRequestDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
}