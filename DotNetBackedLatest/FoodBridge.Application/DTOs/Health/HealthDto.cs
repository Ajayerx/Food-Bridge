namespace FoodBridge.Application.DTOs.Health;

public class HealthDto
{
    public string Status { get; set; } = "ok";
    public string Version { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public Dictionary<string, string> Checks { get; set; } = new();
}
