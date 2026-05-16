using FoodBridge.Application.DTOs.Menu;
using MediatR;
namespace FoodBridge.Application.Features.Restaurants.Queries.GetRestaurantMenu;

public record GetRestaurantMenuQuery(Guid RestaurantId) : IRequest<List<MenuCategoryDto>>;
