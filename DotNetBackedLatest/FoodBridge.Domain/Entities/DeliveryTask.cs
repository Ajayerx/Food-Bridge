using FoodBridge.Domain.Common;
using FoodBridge.Domain.Enums;

namespace FoodBridge.Domain.Entities;

public class DeliveryTask : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public Guid AgentId { get; set; }
    public DeliveryAgent Agent { get; set; } = null!;
    public DeliveryTaskStatus Status { get; set; } = DeliveryTaskStatus.Assigned;
    public decimal EarningsAmount { get; set; } = 0;
    public string? Notes { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PickedUpAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
}
