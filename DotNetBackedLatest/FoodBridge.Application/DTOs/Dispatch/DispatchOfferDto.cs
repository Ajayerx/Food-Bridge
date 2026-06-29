namespace FoodBridge.Application.DTOs.Dispatch;

public class DispatchOfferDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string RestaurantName { get; set; } = string.Empty;
    public string RestaurantAddress { get; set; } = string.Empty;
    public decimal RestaurantLat { get; set; }
    public decimal RestaurantLng { get; set; }
    public string DeliveryAddress { get; set; } = string.Empty;
    public decimal DeliveryLat { get; set; }
    public decimal DeliveryLng { get; set; }
    public decimal EstimatedEarnings { get; set; }
    public decimal EstimatedDistanceKm { get; set; }
}