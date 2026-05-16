using FoodBridge.Application.DTOs.Menu;
using FoodBridge.Application.Features.Menu.Queries.SearchMenuItems;
using MediatR;
namespace FoodBridge.Application.Features.Menu.Queries.GetPopularMenuItems;

public record GetPopularMenuItemsQuery(Guid? RestaurantId, int Limit = 10) : IRequest<List<MenuItemSearchDto>>;
