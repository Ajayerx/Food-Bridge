// DeleteMenuItemCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Menu.Commands.DeleteMenuItem;

public record DeleteMenuItemCommand(
    Guid MenuItemId,
    Guid RestaurantId)
    : IRequest<Unit>;