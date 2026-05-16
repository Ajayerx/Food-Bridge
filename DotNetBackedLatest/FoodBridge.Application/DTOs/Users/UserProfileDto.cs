// UserProfileDto.cs
namespace FoodBridge.Application.DTOs.Users;

public class UserProfileDto
{
    public Guid UserId { get; set; }
    public string MobileNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? FullName { get; set; }
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}