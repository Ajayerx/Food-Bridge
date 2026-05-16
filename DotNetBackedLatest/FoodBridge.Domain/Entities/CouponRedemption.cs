using FoodBridge.Domain.Common;

namespace FoodBridge.Domain.Entities;

public class CouponRedemption : CreatedOnlyEntity
{
    public Guid CouponId { get; set; }
    public Coupon Coupon { get; set; } = null!;
    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public decimal DiscountAmount { get; set; }
}
