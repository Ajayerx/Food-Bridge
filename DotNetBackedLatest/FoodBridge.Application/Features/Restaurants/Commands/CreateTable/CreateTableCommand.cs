// CreateTableCommand.cs
using FoodBridge.Application.DTOs.Restaurants;
using MediatR;

namespace FoodBridge.Application.Features.Restaurants.Commands.CreateTable;

public record CreateTableCommand(
    Guid RestaurantId,
    Guid RequestedByUserId,
    string TableNumber,
    int Capacity
) : IRequest<RestaurantTableDto>;