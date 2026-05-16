// SendMessageCommand.cs
using FoodBridge.Application.DTOs.Support;
using MediatR;
namespace FoodBridge.Application.Features.Support.Commands.SendMessage;

public record SendMessageCommand(
    Guid TicketId,
    Guid SenderId,
    string? SenderRoleType,
    string Message,
    string? AttachmentUrl)
    : IRequest<TicketMessageDto>;