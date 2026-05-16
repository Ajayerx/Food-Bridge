// GetRestaurantTablesQuery.cs
using FoodBridge.Application.DTOs.Restaurants;
using MediatR;

namespace FoodBridge.Application.Features.Restaurants.Queries.GetRestaurantTables;

public record GetRestaurantTablesQuery(Guid RestaurantId)
    : IRequest<List<RestaurantTableDto>>;