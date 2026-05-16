// UpdateMenuCategoryCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Menu;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Menu.Commands.UpdateMenuCategory;

public class UpdateMenuCategoryCommandHandler
    : IRequestHandler<UpdateMenuCategoryCommand, MenuCategoryDto>
{
    private readonly IAppDbContext _db;

    public UpdateMenuCategoryCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<MenuCategoryDto> Handle(
        UpdateMenuCategoryCommand request,
        CancellationToken ct)
    {
        var category = await _db.MenuCategories
            .FirstOrDefaultAsync(
                c => c.Id == request.CategoryId
                  && c.RestaurantId == request.RestaurantId
                  && c.DeletedAt == null, ct)
            ?? throw new NotFoundException(
                "Menu category", request.CategoryId);

        category.Name = request.Name;
        category.ImageUrl = request.ImageUrl;
        category.DisplayOrder = request.DisplayOrder;
        category.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return new MenuCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            ImageUrl = category.ImageUrl,
            DisplayOrder = category.DisplayOrder,
            IsActive = category.IsActive
        };
    }
}