// RegisterDeviceTokenRequestDto.cs
namespace FoodBridge.Application.DTOs.Notifications;

public class RegisterDeviceTokenRequestDto
{
    public string Token { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public string? DeviceId { get; set; }
}