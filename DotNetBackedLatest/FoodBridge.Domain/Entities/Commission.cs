using FoodBridge.Domain.Common;
using FoodBridge.Domain.Enums;

namespace FoodBridge.Domain.Entities;

public class Commission : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public Guid RestaurantId { get; set; }
    public Restaurant Restaurant { get; set; } = null!;
    public decimal Amount { get; set; }
    public decimal Rate { get; set; }
    public CommissionType Type { get; set; } = CommissionType.Percentage;
    public string? Notes { get; set; }
    public Guid? VendorPayoutId { get; set; }
    public VendorPayout? VendorPayout { get; set; }
}
