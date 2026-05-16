// CreateModifierGroupRequestDto.cs
namespace FoodBridge.Application.DTOs.Menu;

public class CreateModifierGroupRequestDto
{
    public string Name { get; set; } = string.Empty;
    public bool IsRequired { get; set; } = false;
    public int MaxSelections { get; set; } = 1;
}