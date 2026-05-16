// DeleteModifierGroupCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Menu.Commands.DeleteModifierGroup;

public class DeleteModifierGroupCommandHandler
    : IRequestHandler<DeleteModifierGroupCommand, Unit>
{
    private readonly IAppDbContext _db;

    public DeleteModifierGroupCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        DeleteModifierGroupCommand request,
        CancellationToken ct)
    {
        var group = await _db.ModifierGroups
            .FirstOrDefaultAsync(
                g => g.Id == request.GroupId
                  && g.MenuItemId == request.MenuItemId, ct)
            ?? throw new NotFoundException(
                "Modifier group", request.GroupId);

        _db.ModifierGroups.Remove(group);
        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}