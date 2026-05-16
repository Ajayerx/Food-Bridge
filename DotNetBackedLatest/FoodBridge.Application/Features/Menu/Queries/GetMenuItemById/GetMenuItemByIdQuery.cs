// GetMenuItemByIdQuery.cs
using FoodBridge.Application.DTOs.Menu;
using MediatR;
namespace FoodBridge.Application.Features.Menu.Queries.GetMenuItemById;

public record GetMenuItemByIdQuery(
    Guid MenuItemId,
    Guid RestaurantId)
    : IRequest<MenuItemDto>;