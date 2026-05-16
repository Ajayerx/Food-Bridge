using FoodBridge.Application.DTOs.Restaurants;
using MediatR;
namespace FoodBridge.Application.Features.Restaurants.Queries.GetMyRestaurants;

public record GetMyRestaurantsQuery(Guid UserId, string? RoleType) : IRequest<List<RestaurantDto>>;
