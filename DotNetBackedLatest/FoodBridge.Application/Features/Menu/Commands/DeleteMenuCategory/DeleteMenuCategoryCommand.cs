// DeleteMenuCategoryCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Menu.Commands.DeleteMenuCategory;

public record DeleteMenuCategoryCommand(
    Guid CategoryId,
    Guid RestaurantId)
    : IRequest<Unit>;