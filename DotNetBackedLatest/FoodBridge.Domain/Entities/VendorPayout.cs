using FoodBridge.Domain.Common;
using FoodBridge.Domain.Enums;

namespace FoodBridge.Domain.Entities;

public class VendorPayout : BaseEntity
{
    public Guid VendorId { get; set; }
    public Vendor Vendor { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public PayoutStatus Status { get; set; } = PayoutStatus.Pending;
    public string? TransactionId { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankIfscCode { get; set; }
    public string? Notes { get; set; }
    public DateTime PeriodFrom { get; set; }
    public DateTime PeriodTo { get; set; }
    public DateTime? ProcessedAt { get; set; }

    public ICollection<Commission> Commissions { get; set; } = new List<Commission>();
}
