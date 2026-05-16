using MediatR;

namespace FoodBridge.Application.Features.Restaurants.Commands.ReserveTable;

public record ReserveTableCommand(Guid TableId, Guid UserId) : IRequest;