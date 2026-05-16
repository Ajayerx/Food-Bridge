// OtpVerifyDto.cs
using System.Text.Json.Serialization;

namespace FoodBridge.Application.DTOs.Auth;

public class OtpVerifyDto
{
    [JsonPropertyName("mobileNumber")]
    public string MobileNumber { get; set; } = string.Empty;
    public string Otp { get; set; } = string.Empty;
    public string? DeviceInfo { get; set; }
}