using FoodBridge.Domain.Enums;

namespace FoodBridge.Application.DTOs.Restaurants;

public class UpdateTableRequestDto
{
    public string TableNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public TableStatus? Status { get; set; }
}