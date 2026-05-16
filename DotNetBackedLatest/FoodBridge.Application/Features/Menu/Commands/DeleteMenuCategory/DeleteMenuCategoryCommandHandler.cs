// DeleteMenuCategoryCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Menu.Commands.DeleteMenuCategory;

public class DeleteMenuCategoryCommandHandler
    : IRequestHandler<DeleteMenuCategoryCommand, Unit>
{
    private readonly IAppDbContext _db;

    public DeleteMenuCategoryCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        DeleteMenuCategoryCommand request,
        CancellationToken ct)
    {
        var category = await _db.MenuCategories
            .FirstOrDefaultAsync(
                c => c.Id == request.CategoryId
                  && c.RestaurantId == request.RestaurantId
                  && c.DeletedAt == null, ct)
            ?? throw new NotFoundException(
                "Menu category", request.CategoryId);

        category.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}