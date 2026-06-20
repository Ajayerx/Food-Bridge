namespace FoodBridge.Application.DTOs.Admin;

public class OperatingHoursDto
{
    public string Day { get; set; } = string.Empty;
    public string Open { get; set; } = string.Empty;
    public string Close { get; set; } = string.Empty;
    public bool Closed { get; set; }
}
