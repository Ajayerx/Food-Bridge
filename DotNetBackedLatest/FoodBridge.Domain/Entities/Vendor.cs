using FoodBridge.Domain.Common;
using FoodBridge.Domain.Enums;

namespace FoodBridge.Domain.Entities;

public class Vendor : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string BusinessName { get; set; } = string.Empty;
    public string? GstNumber { get; set; }
    public string? PanNumber { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankIfscCode { get; set; }
    public VendorStatus Status { get; set; } = VendorStatus.Pending;
    public DateTime? ApprovedAt { get; set; }

    public ICollection<Restaurant> Restaurants { get; set; } = new List<Restaurant>();
    public ICollection<VendorPayout> Payouts { get; set; } = new List<VendorPayout>();
}
