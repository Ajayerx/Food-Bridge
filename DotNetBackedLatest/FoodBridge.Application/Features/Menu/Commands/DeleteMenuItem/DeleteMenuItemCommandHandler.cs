// DeleteMenuItemCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Menu.Commands.DeleteMenuItem;

public class DeleteMenuItemCommandHandler
    : IRequestHandler<DeleteMenuItemCommand, Unit>
{
    private readonly IAppDbContext _db;

    public DeleteMenuItemCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        DeleteMenuItemCommand request,
        CancellationToken ct)
    {
        var item = await _db.MenuItems
            .Include(i => i.Category)
            .FirstOrDefaultAsync(
                i => i.Id == request.MenuItemId
                  && i.Category.RestaurantId == request.RestaurantId
                  && i.DeletedAt == null, ct)
            ?? throw new NotFoundException(
                "Menu item", request.MenuItemId);

        item.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}