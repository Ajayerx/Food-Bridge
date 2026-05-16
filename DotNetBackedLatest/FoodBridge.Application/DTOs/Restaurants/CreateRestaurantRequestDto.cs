// CreateRestaurantRequestDto.cs
namespace FoodBridge.Application.DTOs.Restaurants;

public class CreateRestaurantRequestDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string AddressLine { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PinCode { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public string? PhoneNumber { get; set; }
    public string? FssaiLicense { get; set; }
    public decimal DeliveryFee { get; set; } = 0;
    public decimal MinOrderAmount { get; set; } = 0;
    public int AvgDeliveryMinutes { get; set; } = 30;
}