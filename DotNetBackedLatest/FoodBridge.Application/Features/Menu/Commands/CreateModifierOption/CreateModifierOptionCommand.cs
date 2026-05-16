// CreateModifierOptionCommand.cs
using FoodBridge.Application.DTOs.Menu;
using MediatR;
namespace FoodBridge.Application.Features.Menu.Commands.CreateModifierOption;

public record CreateModifierOptionCommand(
    Guid ModifierGroupId,
    string Name,
    decimal AdditionalPrice)
    : IRequest<ModifierOptionDto>;