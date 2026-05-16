// DeliveryTaskDto.cs
namespace FoodBridge.Application.DTOs.Delivery;

public class DeliveryTaskDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public Guid AgentId { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public string AgentMobile { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string RestaurantName { get; set; } = string.Empty;
    public string RestaurantAddress { get; set; } = string.Empty;
    public decimal RestaurantLat { get; set; }
    public decimal RestaurantLng { get; set; }
    public string DeliveryAddress { get; set; } = string.Empty;
    public decimal DeliveryLat { get; set; }
    public decimal DeliveryLng { get; set; }
    public decimal EarningsAmount { get; set; }
    public string? Notes { get; set; }
    public DateTime AssignedAt { get; set; }
    public DateTime? PickedUpAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
}