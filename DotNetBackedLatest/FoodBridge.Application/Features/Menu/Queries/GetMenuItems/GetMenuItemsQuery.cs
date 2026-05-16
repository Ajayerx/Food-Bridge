// GetMenuItemsQuery.cs
using FoodBridge.Application.DTOs.Menu;
using MediatR;
namespace FoodBridge.Application.Features.Menu.Queries.GetMenuItems;

public record GetMenuItemsQuery(
    Guid RestaurantId,
    Guid? CategoryId)
    : IRequest<List<MenuItemDto>>;