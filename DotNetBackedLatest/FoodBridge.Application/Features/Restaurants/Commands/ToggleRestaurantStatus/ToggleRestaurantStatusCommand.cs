// ToggleRestaurantStatusCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Restaurants.Commands.ToggleRestaurantStatus;

public record ToggleRestaurantStatusCommand(
    Guid RestaurantId,
    Guid VendorUserId)
    : IRequest<bool>;