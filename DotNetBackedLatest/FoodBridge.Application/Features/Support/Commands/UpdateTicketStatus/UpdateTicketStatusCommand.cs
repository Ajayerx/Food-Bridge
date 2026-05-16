// UpdateTicketStatusCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Support.Commands.UpdateTicketStatus;

public record UpdateTicketStatusCommand(
    Guid TicketId,
    Guid AdminUserId,
    string Status)
    : IRequest<Unit>;