// GetMenuCategoriesQuery.cs
using FoodBridge.Application.DTOs.Menu;
using MediatR;
namespace FoodBridge.Application.Features.Menu.Queries.GetMenuCategories;

public record GetMenuCategoriesQuery(Guid RestaurantId)
    : IRequest<List<MenuCategoryDto>>;