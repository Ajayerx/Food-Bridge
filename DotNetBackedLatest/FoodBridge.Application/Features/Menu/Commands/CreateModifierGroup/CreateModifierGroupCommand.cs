// CreateModifierGroupCommand.cs
using FoodBridge.Application.DTOs.Menu;
using MediatR;
namespace FoodBridge.Application.Features.Menu.Commands.CreateModifierGroup;

public record CreateModifierGroupCommand(
    Guid MenuItemId,
    string Name,
    bool IsRequired,
    int MaxSelections)
    : IRequest<ModifierGroupDto>;