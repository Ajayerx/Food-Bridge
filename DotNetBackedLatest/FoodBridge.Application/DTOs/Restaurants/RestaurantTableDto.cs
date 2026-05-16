namespace FoodBridge.Application.DTOs.Restaurants;

public class RestaurantTableDto
{
    public Guid Id { get; set; }
    public Guid RestaurantId { get; set; }
    public string TableNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public bool IsAvailable { get; set; }
    public string Status { get; set; } = "Available";
}