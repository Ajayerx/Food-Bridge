// CancelOrderRequestDto.cs
namespace FoodBridge.Application.DTOs.Orders;

public class CancelOrderRequestDto
{
    public string Reason { get; set; } = string.Empty;
}