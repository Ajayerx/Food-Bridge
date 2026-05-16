// RazorpayOrderResponseDto.cs
namespace FoodBridge.Application.DTOs.Payments;

public class RazorpayOrderResponseDto
{
    public string RazorpayOrderId { get; set; } = string.Empty;
    public string KeyId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public Guid OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerMobile { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
}