// UpdateProfileRequestDto.cs
namespace FoodBridge.Application.DTOs.Users;

public class UpdateProfileRequestDto
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? AvatarUrl { get; set; }
}