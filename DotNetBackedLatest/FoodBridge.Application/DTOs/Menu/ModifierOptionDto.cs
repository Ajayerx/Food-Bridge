// ModifierOptionDto.cs
namespace FoodBridge.Application.DTOs.Menu;

public class ModifierOptionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal AdditionalPrice { get; set; }
    public bool IsAvailable { get; set; }
}