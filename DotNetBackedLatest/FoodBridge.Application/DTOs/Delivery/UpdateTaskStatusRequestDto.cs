// UpdateTaskStatusRequestDto.cs
namespace FoodBridge.Application.DTOs.Delivery;

public class UpdateTaskStatusRequestDto
{
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public decimal? CurrentLatitude { get; set; }
    public decimal? CurrentLongitude { get; set; }
}