// CreateItemVariantCommand.cs
using FoodBridge.Application.DTOs.Menu;
using MediatR;
namespace FoodBridge.Application.Features.Menu.Commands.CreateItemVariant;

public record CreateItemVariantCommand(
    Guid MenuItemId,
    string Name,
    decimal Price)
    : IRequest<ItemVariantDto>;