using MediatR;
namespace FoodBridge.Application.Features.Restaurants.Commands.RejectRestaurant;

public record RejectRestaurantCommand(Guid RestaurantId, string? Reason) : IRequest<Unit>;
