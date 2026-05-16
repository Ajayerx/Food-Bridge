// GetTableByIdQuery.cs
using FoodBridge.Application.DTOs.Restaurants;
using MediatR;

namespace FoodBridge.Application.Features.Restaurants.Queries.GetTableById;

public record GetTableByIdQuery(Guid TableId)
    : IRequest<RestaurantTableDto>;