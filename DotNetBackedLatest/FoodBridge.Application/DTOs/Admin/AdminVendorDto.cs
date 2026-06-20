namespace FoodBridge.Application.DTOs.Admin;

public class AdminVendorDto
{
    public Guid Id { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? ApprovedAt { get; set; }

    public string? UserName { get; set; }
    public string MobileNumber { get; set; } = string.Empty;
    public string? Email { get; set; }

    public int RestaurantCount { get; set; }
    public string? RestaurantNames { get; set; }
    public List<AdminVendorRestaurantDto>? VendorRestaurants { get; set; }

    public string? GstNumber { get; set; }
    public string? PanNumber { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankIfscCode { get; set; }
    public string? BankHolderName { get; set; }

    public DateTime CreatedAt { get; set; }
}
