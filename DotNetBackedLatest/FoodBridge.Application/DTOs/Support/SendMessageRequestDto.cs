// SendMessageRequestDto.cs
namespace FoodBridge.Application.DTOs.Support;

public class SendMessageRequestDto
{
    public string Message { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
}