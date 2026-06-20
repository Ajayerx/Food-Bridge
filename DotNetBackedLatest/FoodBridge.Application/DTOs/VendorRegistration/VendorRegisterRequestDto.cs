using System.Text.Json;
using System.Text.Json.Serialization;

namespace FoodBridge.Application.DTOs.VendorRegistration;

public class VendorRegisterRequestDto
{
    public string MobileNumber { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string FullName { get; set; } = string.Empty;

    public string? Email { get; set; }

    [JsonPropertyName("company_name")]
    public string BusinessName { get; set; } = string.Empty;

    [JsonPropertyName("gstin")]
    public string? GstNumber { get; set; }

    [JsonPropertyName("pan_number")]
    public string? PanNumber { get; set; }

    [JsonPropertyName("bank_account_number")]
    public string? BankAccountNumber { get; set; }

    [JsonPropertyName("bank_ifsc_code")]
    public string? BankIfscCode { get; set; }

    [JsonPropertyName("bank_holder_name")]
    public string? BankHolderName { get; set; }

    [JsonPropertyName("restaurant_name")]
    public string RestaurantName { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("cuisines")]
    public List<string>? Cuisines { get; set; }

    [JsonPropertyName("address")]
    public string Address { get; set; } = string.Empty;

    [JsonPropertyName("city")]
    public string City { get; set; } = string.Empty;

    [JsonPropertyName("state")]
    public string State { get; set; } = string.Empty;

    [JsonPropertyName("pin_code")]
    public string PinCode { get; set; } = string.Empty;

    [JsonPropertyName("latitude")]
    public decimal? Latitude { get; set; }

    [JsonPropertyName("longitude")]
    public decimal? Longitude { get; set; }

    [JsonPropertyName("is_pure_veg")]
    public bool IsPureVeg { get; set; }

    [JsonPropertyName("fssai_license")]
    public string? FssaiLicense { get; set; }

    [JsonPropertyName("contact_phone")]
    public string? PhoneNumber { get; set; }

    [JsonPropertyName("delivery_fee")]
    public decimal DeliveryFee { get; set; }

    [JsonPropertyName("min_order_value")]
    public decimal MinOrderAmount { get; set; }

    [JsonPropertyName("avg_prep_time_minutes")]
    public int AvgPrepMinutes { get; set; }

    [JsonPropertyName("is_dine_in_enabled")]
    public bool IsDineInEnabled { get; set; }

    [JsonPropertyName("is_takeaway_enabled")]
    public bool IsTakeawayEnabled { get; set; }

    [JsonPropertyName("is_delivery_enabled")]
    public bool IsDeliveryEnabled { get; set; }

    [JsonPropertyName("operating_hours")]
    public JsonElement? OperatingHours { get; set; }
}

public class VendorRegisterResponseDto
{
    public Guid UserId { get; set; }
    public Guid VendorId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
