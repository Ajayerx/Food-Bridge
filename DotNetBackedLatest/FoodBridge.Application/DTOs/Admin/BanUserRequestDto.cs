// BanUserRequestDto.cs
namespace FoodBridge.Application.DTOs.Admin;

public class BanUserRequestDto
{
    public string Reason { get; set; } = string.Empty;
}