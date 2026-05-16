using FoodBridge.Domain.Common;

namespace FoodBridge.Domain.Entities;

public class Customer : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string? PreferredLanguage { get; set; }
    public bool EmailNotifications { get; set; } = true;
    public bool SmsNotifications { get; set; } = true;

    public ICollection<CustomerAddress> Addresses { get; set; } = new List<CustomerAddress>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<CouponRedemption> CouponRedemptions { get; set; } = new List<CouponRedemption>();
}
