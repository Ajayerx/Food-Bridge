// ValidateCouponResponseDto.cs
namespace FoodBridge.Application.DTOs.Coupons;

public class ValidateCouponResponseDto
{
    public bool IsValid { get; set; }
    public string? Message { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal FinalAmount { get; set; }
    public string CouponCode { get; set; } = string.Empty;
}