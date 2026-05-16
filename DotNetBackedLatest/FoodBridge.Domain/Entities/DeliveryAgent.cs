using FoodBridge.Domain.Common;
using FoodBridge.Domain.Enums;

namespace FoodBridge.Domain.Entities;

public class DeliveryAgent : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string? VehicleType { get; set; }
    public string? VehicleNumber { get; set; }
    public string? LicenseNumber { get; set; }
    public AgentStatus Status { get; set; } = AgentStatus.Active;
    public bool IsAvailable { get; set; } = false;
    public decimal? CurrentLatitude { get; set; }
    public decimal? CurrentLongitude { get; set; }
    public decimal TotalEarnings { get; set; } = 0;
    public int TotalDeliveries { get; set; } = 0;

    public ICollection<DeliveryTask> DeliveryTasks { get; set; } = new List<DeliveryTask>();
}
