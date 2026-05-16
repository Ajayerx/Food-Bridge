// CreateStaffRequestDto.cs
namespace FoodBridge.Application.DTOs.Staff;

public class CreateStaffRequestDto
{
    public string MobileNumber { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string StaffRole { get; set; } = "Kitchen";
}