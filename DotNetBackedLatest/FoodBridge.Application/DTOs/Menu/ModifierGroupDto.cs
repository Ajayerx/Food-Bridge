// ModifierGroupDto.cs
namespace FoodBridge.Application.DTOs.Menu;

public class ModifierGroupDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public int MaxSelections { get; set; }
    public List<ModifierOptionDto> Options { get; set; } = new();
}