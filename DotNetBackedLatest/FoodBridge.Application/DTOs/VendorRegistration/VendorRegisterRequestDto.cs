namespace FoodBridge.Application.DTOs.VendorRegistration;

public class VendorRegisterRequestDto
{
    public string MobileNumber { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public string? GstNumber { get; set; }
    public string? PanNumber { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankIfscCode { get; set; }
    public string? BankHolderName { get; set; }
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
