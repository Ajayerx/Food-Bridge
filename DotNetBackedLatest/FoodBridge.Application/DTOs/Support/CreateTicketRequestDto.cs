// CreateTicketRequestDto.cs
namespace FoodBridge.Application.DTOs.Support;

public class CreateTicketRequestDto
{
    public Guid? OrderId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}