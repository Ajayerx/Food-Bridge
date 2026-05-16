// CancelOrderCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Orders.Commands.CancelOrder;

public record CancelOrderCommand(
    Guid OrderId,
    Guid UserId,
    string? Reason,
    string UserRole)
    : IRequest<Unit>;