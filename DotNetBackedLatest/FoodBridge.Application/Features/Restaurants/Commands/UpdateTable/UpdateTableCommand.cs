using FoodBridge.Application.DTOs.Restaurants;
using FoodBridge.Domain.Enums;
using MediatR;

namespace FoodBridge.Application.Features.Restaurants.Commands.UpdateTable;

public record UpdateTableCommand(
    Guid TableId,
    Guid RequestedByUserId,
    string TableNumber,
    int Capacity,
    TableStatus? Status        
) : IRequest<RestaurantTableDto>;