using FoodBridge.Domain.Common;
using FoodBridge.Domain.Enums;

namespace FoodBridge.Domain.Entities;

public class Refund : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public Guid PaymentId { get; set; }
    public Payment Payment { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public RefundStatus Status { get; set; } = RefundStatus.Pending;
    public string? Reason { get; set; }
    public string? GatewayRefundId { get; set; }
    public DateTime? ProcessedAt { get; set; }
}
