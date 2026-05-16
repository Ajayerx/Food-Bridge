// DeleteItemVariantCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Menu.Commands.DeleteItemVariant;

public record DeleteItemVariantCommand(
    Guid VariantId,
    Guid MenuItemId)
    : IRequest<Unit>;