// CreateTicketCommand.cs
using FoodBridge.Application.DTOs.Support;
using MediatR;
namespace FoodBridge.Application.Features.Support.Commands.CreateTicket;

public record CreateTicketCommand(
    Guid UserId,
    Guid? OrderId,
    string Subject,
    string Message)
    : IRequest<SupportTicketDto>;