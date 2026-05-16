// UpdateTaskStatusCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Delivery.Commands.UpdateTaskStatus;

public record UpdateTaskStatusCommand(
    Guid TaskId,
    Guid AgentUserId,
    string Status,
    string? Notes,
    decimal? CurrentLatitude,
    decimal? CurrentLongitude)
    : IRequest<Unit>;