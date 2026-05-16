// Order.cs
using FoodBridge.Domain.Common;
using FoodBridge.Domain.Enums;

namespace FoodBridge.Domain.Entities;

public class Order : BaseEntity
{
    public string OrderCode { get; set; } = string.Empty;
    public Guid? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public Guid RestaurantId { get; set; }
    public Restaurant Restaurant { get; set; } = null!;
    public OrderType OrderType { get; set; }
    public OrderStatus OrderStatus { get; set; } = OrderStatus.Placed;
    public PaymentMethod PaymentMethod { get; set; }
    public OrderPaymentStatus PaymentStatus { get; set; } = OrderPaymentStatus.Pending;

    public Guid? DeliveryAddressId { get; set; }
    public CustomerAddress? DeliveryAddress { get; set; }
    public Guid? TableId { get; set; }
    public RestaurantTable? Table { get; set; }
    public Guid? DeliveryAgentId { get; set; }
    public DeliveryAgent? DeliveryAgent { get; set; }

    public Guid? CouponId { get; set; }
    public Coupon? Coupon { get; set; }
    public string? CouponCodeSnapshot { get; set; }

    public decimal SubtotalAmount { get; set; }
    public decimal TaxAmount { get; set; } = 0;
    public decimal DeliveryFee { get; set; } = 0;
    public decimal DiscountAmount { get; set; } = 0;
    public decimal TotalAmount { get; set; }

    public string? Notes { get; set; }
    public string? CancelReason { get; set; }
    public DateTime? DeliveredAt { get; set; }

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    // ── Domain Methods ────────────────────────────────────

    public void MarkAsDelivered()
    {
        OrderStatus = OrderStatus.Delivered;
        DeliveredAt = DateTime.UtcNow;
        TryAutoCompletePayment();
    }

    public void MarkAsCompleted()
    {
        OrderStatus = OrderStatus.Completed;
        TryAutoCompletePayment();
    }

    private void TryAutoCompletePayment()
    {
        if (PaymentStatus != OrderPaymentStatus.Pending) return;

        var shouldAutoPay = PaymentMethod switch
        {
            // Online Delivery: auto-pay on Delivered
            PaymentMethod.Online when OrderType == OrderType.Delivery
                => OrderStatus == OrderStatus.Delivered,

            // COD Delivery: auto-pay on Delivered (agent collected cash)
            PaymentMethod.COD when OrderType == OrderType.Delivery
                => OrderStatus == OrderStatus.Delivered,

            // DineIn/Takeaway: PaymentMethod.Pending means
            // vendor will call SettleBill() manually — never auto-pay
            _ => false
        };

        if (shouldAutoPay)
            PaymentStatus = OrderPaymentStatus.Paid;
    }

    // ── Called at billing time for DineIn/Takeaway ────────
    public void SettleBill(PaymentMethod method)
    {
        if (OrderType != OrderType.DineIn && OrderType != OrderType.Takeaway)
            throw new InvalidOperationException(
                "SettleBill is only for DineIn and Takeaway orders.");

        if (PaymentStatus == OrderPaymentStatus.Paid)
            throw new InvalidOperationException(
                "Bill is already paid.");

        if (OrderStatus != OrderStatus.Completed)
            throw new InvalidOperationException(
                "Order must be Completed before settling the bill.");

        if (method == PaymentMethod.Pending)
            throw new InvalidOperationException(
                "A valid payment method (Online or COD) must be selected.");

        PaymentMethod = method;
        PaymentStatus = OrderPaymentStatus.Paid;
    }

    // ── Called for Delivery COD if needed manually ────────
    public void ConfirmCodPayment()
    {
        if (OrderType != OrderType.Delivery)
            throw new InvalidOperationException(
                "Use SettleBill() for DineIn and Takeaway orders.");

        if (PaymentMethod != PaymentMethod.COD)
            throw new InvalidOperationException(
                "Only COD orders require manual payment confirmation.");

        if (PaymentStatus == OrderPaymentStatus.Paid)
            throw new InvalidOperationException(
                "Payment is already confirmed.");

        if (OrderStatus != OrderStatus.Delivered)
            throw new InvalidOperationException(
                "Order must be Delivered before confirming payment.");

        PaymentStatus = OrderPaymentStatus.Paid;
    }
}