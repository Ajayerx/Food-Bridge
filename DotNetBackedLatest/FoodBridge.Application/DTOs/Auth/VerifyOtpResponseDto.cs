// VerifyOtpResponseDto.cs
namespace FoodBridge.Application.DTOs.Auth;

public class VerifyOtpResponseDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? StaffRole { get; set; }
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; }
    public bool IsNewUser { get; set; }
}