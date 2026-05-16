// ToggleTableAvailabilityCommand.cs
using MediatR;

namespace FoodBridge.Application.Features.Restaurants.Commands.ToggleTableAvailability;

public record ToggleTableAvailabilityCommand(
    Guid TableId,
    Guid RequestedByUserId
) : IRequest;