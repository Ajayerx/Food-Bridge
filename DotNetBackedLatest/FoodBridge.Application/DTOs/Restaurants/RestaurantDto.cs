// RestaurantDto.cs
namespace FoodBridge.Application.DTOs.Restaurants;

public class RestaurantDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public string AddressLine { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PinCode { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }       
    public string? FssaiLicense { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsOpen { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal MinOrderAmount { get; set; }
    public int AvgDeliveryMinutes { get; set; }
    public decimal? AvgRating { get; set; }
    public int TotalRatings { get; set; }
    public bool IsPureVeg { get; set; }
    public DateTime CreatedAt { get; set; }

    public string? VendorName { get; set; }
    public string? VendorMobile { get; set; }
    public string? VendorEmail { get; set; }
}