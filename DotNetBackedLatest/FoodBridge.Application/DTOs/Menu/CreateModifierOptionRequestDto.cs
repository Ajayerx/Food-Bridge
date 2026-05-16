// CreateModifierOptionRequestDto.cs
namespace FoodBridge.Application.DTOs.Menu;

public class CreateModifierOptionRequestDto
{
    public string Name { get; set; } = string.Empty;
    public decimal AdditionalPrice { get; set; } = 0;
}