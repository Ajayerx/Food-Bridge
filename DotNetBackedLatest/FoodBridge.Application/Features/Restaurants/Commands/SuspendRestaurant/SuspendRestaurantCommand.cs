using MediatR;
namespace FoodBridge.Application.Features.Restaurants.Commands.SuspendRestaurant;

public record SuspendRestaurantCommand(Guid RestaurantId, string? Reason) : IRequest<Unit>;
