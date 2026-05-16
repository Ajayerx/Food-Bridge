// UpdateMenuCategoryCommand.cs
using FoodBridge.Application.DTOs.Menu;
using MediatR;
namespace FoodBridge.Application.Features.Menu.Commands.UpdateMenuCategory;

public record UpdateMenuCategoryCommand(
    Guid CategoryId,
    Guid RestaurantId,
    string Name,
    string? ImageUrl,
    int DisplayOrder)
    : IRequest<MenuCategoryDto>;