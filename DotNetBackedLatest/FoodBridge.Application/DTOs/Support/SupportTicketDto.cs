// SupportTicketDto.cs
namespace FoodBridge.Application.DTOs.Support;

public class SupportTicketDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserMobile { get; set; } = string.Empty;
    public Guid? OrderId { get; set; }
    public string? OrderCode { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public List<TicketMessageDto> Messages { get; set; } = new();
}

public class TicketMessageDto
{
    public Guid Id { get; set; }
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}