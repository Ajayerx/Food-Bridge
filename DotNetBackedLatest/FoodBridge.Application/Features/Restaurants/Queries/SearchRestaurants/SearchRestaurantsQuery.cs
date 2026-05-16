using FoodBridge.Application.DTOs.Restaurants;
using MediatR;
namespace FoodBridge.Application.Features.Restaurants.Queries.SearchRestaurants;

public record SearchRestaurantsQuery(
    string? Q,
    string? City,
    decimal? Lat,
    decimal? Lng,
    decimal? RadiusKm,
    bool? IsOpen,
    int Page,
    int PageSize)
    : IRequest<SearchRestaurantsResult>;

public record SearchRestaurantsResult(List<RestaurantDto> Items, int TotalCount);
