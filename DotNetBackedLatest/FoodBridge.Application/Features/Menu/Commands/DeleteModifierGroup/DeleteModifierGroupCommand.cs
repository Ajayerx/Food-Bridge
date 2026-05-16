// DeleteModifierGroupCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Menu.Commands.DeleteModifierGroup;

public record DeleteModifierGroupCommand(
    Guid GroupId,
    Guid MenuItemId)
    : IRequest<Unit>;