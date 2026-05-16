using FoodBridge.Application.DTOs.Restaurants;
using MediatR;

namespace FoodBridge.Application.Features.Restaurants.Queries.GetAdminRestaurants;

public record GetAdminRestaurantsQuery(
    string? Status,
    string? Search,
    int Page,
    int PageSize)
    : IRequest<List<RestaurantDto>>;