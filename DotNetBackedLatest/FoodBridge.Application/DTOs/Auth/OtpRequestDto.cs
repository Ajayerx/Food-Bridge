// OtpRequestDto.cs
using System.Text.Json.Serialization;

namespace FoodBridge.Application.DTOs.Auth;

public class OtpRequestDto
{
    [JsonPropertyName("mobileNumber")]
    public string MobileNumber { get; set; } = string.Empty;
}