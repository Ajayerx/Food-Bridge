using FoodBridge.Application.DTOs.Restaurants;
using MediatR;

namespace FoodBridge.Application.Features.Restaurants.Queries.GetRestaurants;

public record GetRestaurantsQuery(
    string? City,
    string? Search,
    int Page,
    int PageSize,
    bool? IsPureVeg = null,
    decimal? MinRating = null,
    int? MaxPrepTime = null,
    decimal? MaxCost = null,
    bool? Popular = null,
    bool? IsNew = null,
    string? SortBy = null)
    : IRequest<List<RestaurantDto>>;