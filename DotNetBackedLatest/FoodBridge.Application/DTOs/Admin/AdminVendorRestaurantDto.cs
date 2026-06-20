namespace FoodBridge.Application.DTOs.Admin;

public class AdminVendorRestaurantDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<string>? Cuisines { get; set; }
    public List<OperatingHoursDto>? OperatingHours { get; set; }
    public string AddressLine { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PinCode { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? FssaiLicense { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal MinOrderAmount { get; set; }
    public int AvgPrepMinutes { get; set; }
    public bool IsPureVeg { get; set; }
    public bool IsDineInEnabled { get; set; }
    public bool IsTakeawayEnabled { get; set; }
    public bool IsDeliveryEnabled { get; set; }
}
