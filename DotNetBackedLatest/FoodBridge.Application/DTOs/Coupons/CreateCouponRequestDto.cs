// CreateCouponRequestDto.cs
namespace FoodBridge.Application.DTOs.Coupons;

public class CreateCouponRequestDto
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string CouponType { get; set; } = "Percentage";
    public decimal DiscountValue { get; set; }
    public decimal MinOrderAmount { get; set; } = 0;
    public decimal? MaxDiscountAmount { get; set; }
    public int? UsageLimit { get; set; }
    public int? PerUserLimit { get; set; }
    public Guid? RestaurantId { get; set; }
    public DateTime? ExpiresAt { get; set; }
}