// UpdateRestaurantRequestDto.cs
namespace FoodBridge.Application.DTOs.Restaurants;

public class UpdateRestaurantRequestDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? AddressLine { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PinCode { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? PhoneNumber { get; set; }
    public decimal? DeliveryFee { get; set; }
    public decimal? MinOrderAmount { get; set; }
    public int? AvgDeliveryMinutes { get; set; }
}