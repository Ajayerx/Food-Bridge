using FoodBridge.Domain.Common;
using FoodBridge.Domain.Enums;

namespace FoodBridge.Domain.Entities;

public class DispatchOffer : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public DispatchOfferStatus Status { get; set; } = DispatchOfferStatus.Pending;
    public DateTime ExpiresAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public Guid? AcceptedByAgentId { get; set; }
    public DeliveryAgent? AcceptedByAgent { get; set; }
}