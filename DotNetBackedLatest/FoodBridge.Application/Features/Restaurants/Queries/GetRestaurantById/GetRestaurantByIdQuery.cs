// GetRestaurantByIdQuery.cs
using FoodBridge.Application.DTOs.Restaurants;
using MediatR;
namespace FoodBridge.Application.Features.Restaurants.Queries.GetRestaurantById;

public record GetRestaurantByIdQuery(Guid RestaurantId)
    : IRequest<RestaurantDto>;