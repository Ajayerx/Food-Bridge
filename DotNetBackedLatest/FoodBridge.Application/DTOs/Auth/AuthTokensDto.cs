// AuthTokensDto.cs
namespace FoodBridge.Application.DTOs.Auth;

public class AuthTokensDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public int ExpiresInMinutes { get; set; }
    public string TokenType { get; set; } = "Bearer";
}