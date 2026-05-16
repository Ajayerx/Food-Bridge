// CreateMenuCategoryCommand.cs
using FoodBridge.Application.DTOs.Menu;
using MediatR;
namespace FoodBridge.Application.Features.Menu.Commands.CreateMenuCategory;

public record CreateMenuCategoryCommand(
    Guid RestaurantId,
    string Name,
    string? ImageUrl,
    int DisplayOrder)
    : IRequest<MenuCategoryDto>;