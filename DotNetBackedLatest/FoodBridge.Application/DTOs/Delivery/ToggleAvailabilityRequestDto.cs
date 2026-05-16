// ToggleAvailabilityRequestDto.cs
namespace FoodBridge.Application.DTOs.Delivery;

public class ToggleAvailabilityRequestDto
{
    public bool IsAvailable { get; set; }
    public decimal? CurrentLatitude { get; set; }
    public decimal? CurrentLongitude { get; set; }
}