// UpdateItemVariantCommand.cs
using FoodBridge.Application.DTOs.Menu;
using MediatR;
namespace FoodBridge.Application.Features.Menu.Commands.UpdateItemVariant;

public record UpdateItemVariantCommand(
    Guid VariantId,
    Guid MenuItemId,
    string Name,
    decimal Price)
    : IRequest<ItemVariantDto>;