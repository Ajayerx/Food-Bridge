// DeleteItemVariantCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Menu.Commands.DeleteItemVariant;

public class DeleteItemVariantCommandHandler
    : IRequestHandler<DeleteItemVariantCommand, Unit>
{
    private readonly IAppDbContext _db;

    public DeleteItemVariantCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        DeleteItemVariantCommand request,
        CancellationToken ct)
    {
        var variant = await _db.ItemVariants
            .FirstOrDefaultAsync(
                v => v.Id == request.VariantId
                  && v.MenuItemId == request.MenuItemId, ct)
            ?? throw new NotFoundException(
                "Item variant", request.VariantId);

        _db.ItemVariants.Remove(variant);
        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}