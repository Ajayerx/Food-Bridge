// PaymentWebhookDto.cs
namespace FoodBridge.Application.DTOs.Payments;

public class PaymentWebhookDto
{
    public string Event { get; set; } = string.Empty;
    public object? Payload { get; set; }
}