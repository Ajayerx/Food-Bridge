namespace FoodBridge.Application.DTOs.Restaurants;

public class RestaurantListResult
{
    public List<RestaurantDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
}
