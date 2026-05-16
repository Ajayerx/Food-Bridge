// UpdateMenuItemCommand.cs
using FoodBridge.Application.DTOs.Menu;
using MediatR;
namespace FoodBridge.Application.Features.Menu.Commands.UpdateMenuItem;

public record UpdateMenuItemCommand(
    Guid MenuItemId,
    Guid RestaurantId,
    string? Name,
    string? Description,
    decimal? BasePrice,
    string? ImageUrl,
    string? DietaryTag,
    bool? IsAvailable,
    bool? IsFeatured,
    int? PrepTimeMinutes)
    : IRequest<MenuItemDto>;