// UpdateOrderStatusRequestDto.cs
namespace FoodBridge.Application.DTOs.Orders;

public class UpdateOrderStatusRequestDto
{
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
}