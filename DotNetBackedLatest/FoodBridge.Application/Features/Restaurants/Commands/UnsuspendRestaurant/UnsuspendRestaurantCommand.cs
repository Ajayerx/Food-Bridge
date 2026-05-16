using MediatR;

namespace FoodBridge.Application.Features.Restaurants.Commands.UnsuspendRestaurant;

public record UnsuspendRestaurantCommand(Guid RestaurantId) : IRequest<Unit>;