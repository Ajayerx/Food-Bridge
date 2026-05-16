using FoodBridge.Domain.Common;
using FoodBridge.Domain.Enums;

namespace FoodBridge.Domain.Entities;

public class Restaurant : SoftDeleteEntity
{
    public Guid VendorId { get; set; }
    public Vendor Vendor { get; set; } = null!;
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
    public string? FssaiLicense { get; set; }
    public RestaurantStatus Status { get; set; } = RestaurantStatus.Pending;
    public bool IsOpen { get; set; } = false;
    public decimal DeliveryFee { get; set; } = 0;
    public decimal MinOrderAmount { get; set; } = 0;
    public int AvgDeliveryMinutes { get; set; } = 30;
    public decimal? AvgRating { get; set; }
    public int TotalRatings { get; set; } = 0;
    public bool IsPureVeg { get; set; } = false;

    public ICollection<RestaurantTable> Tables { get; set; } = new List<RestaurantTable>();
    public ICollection<MenuCategory> MenuCategories { get; set; } = new List<MenuCategory>();
    public ICollection<StaffUser> Staff { get; set; } = new List<StaffUser>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
