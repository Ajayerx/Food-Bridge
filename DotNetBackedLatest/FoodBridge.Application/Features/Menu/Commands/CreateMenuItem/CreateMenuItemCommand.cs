// CreateMenuItemCommand.cs
using FoodBridge.Application.DTOs.Menu;
using MediatR;
namespace FoodBridge.Application.Features.Menu.Commands.CreateMenuItem;

public record CreateMenuItemCommand(
    Guid CategoryId,
    Guid RestaurantId,
    string Name,
    string? Description,
    decimal BasePrice,
    string? ImageUrl,
    string DietaryTag,
    int PrepTimeMinutes)
    : IRequest<MenuItemDto>;