// UpdateOrderStatusCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Orders.Commands.UpdateOrderStatus;

public record UpdateOrderStatusCommand(
    Guid OrderId,
    Guid UserId,
    string Status,
    string? Reason)
    : IRequest<Unit>;