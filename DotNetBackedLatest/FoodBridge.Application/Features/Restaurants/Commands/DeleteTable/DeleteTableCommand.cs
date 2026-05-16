// DeleteTableCommand.cs
using MediatR;

namespace FoodBridge.Application.Features.Restaurants.Commands.DeleteTable;

public record DeleteTableCommand(
    Guid TableId,
    Guid RequestedByUserId
) : IRequest;