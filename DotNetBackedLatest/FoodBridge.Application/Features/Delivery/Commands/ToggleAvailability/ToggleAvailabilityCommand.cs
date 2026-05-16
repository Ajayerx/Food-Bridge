// ToggleAvailabilityCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Delivery.Commands.ToggleAvailability;

public record ToggleAvailabilityCommand(
    Guid AgentUserId,
    bool IsAvailable,
    decimal? CurrentLatitude,
    decimal? CurrentLongitude)
    : IRequest<Unit>;