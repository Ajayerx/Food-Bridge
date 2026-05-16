// ApproveRestaurantCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Restaurants.Commands.ApproveRestaurant;

public record ApproveRestaurantCommand(Guid RestaurantId)
    : IRequest<Unit>;