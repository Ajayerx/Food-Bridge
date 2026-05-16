// RefreshRequestDto.cs
namespace FoodBridge.Application.DTOs.Auth;

public class RefreshRequestDto
{
    public string RefreshToken { get; set; } = string.Empty;
}