// CreateMenuCategoryCommandHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Menu;
using FoodBridge.Domain.Entities;
using MediatR;
namespace FoodBridge.Application.Features.Menu.Commands.CreateMenuCategory;

public class CreateMenuCategoryCommandHandler
    : IRequestHandler<CreateMenuCategoryCommand, MenuCategoryDto>
{
    private readonly IAppDbContext _db;

    public CreateMenuCategoryCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<MenuCategoryDto> Handle(
        CreateMenuCategoryCommand request,
        CancellationToken ct)
    {
        var category = new MenuCategory
        {
            RestaurantId = request.RestaurantId,
            Name = request.Name,
            ImageUrl = request.ImageUrl,
            DisplayOrder = request.DisplayOrder,
            IsActive = true
        };

        _db.MenuCategories.Add(category);
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