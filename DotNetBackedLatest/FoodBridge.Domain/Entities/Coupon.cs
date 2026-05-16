using FoodBridge.Domain.Common;
using FoodBridge.Domain.Enums;

namespace FoodBridge.Domain.Entities;

public class Coupon : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public CouponType CouponType { get; set; }
    public decimal DiscountValue { get; set; }
    public decimal MinOrderAmount { get; set; } = 0;
    public decimal? MaxDiscountAmount { get; set; }
    public int? UsageLimit { get; set; }
    public int UsageCount { get; set; } = 0;
    public int? PerUserLimit { get; set; }
    public Guid? RestaurantId { get; set; }
    public Restaurant? Restaurant { get; set; }
    public CouponStatus Status { get; set; } = CouponStatus.Active;
    public DateTime? ExpiresAt { get; set; }
}
