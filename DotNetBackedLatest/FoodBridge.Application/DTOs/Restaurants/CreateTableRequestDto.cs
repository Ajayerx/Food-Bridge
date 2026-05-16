namespace FoodBridge.Application.DTOs.Restaurants;

public class CreateTableRequestDto
{
    public string TableNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
}