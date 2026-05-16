// GetMenuCategoriesQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Menu;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Menu.Queries.GetMenuCategories;

public class GetMenuCategoriesQueryHandler
    : IRequestHandler<GetMenuCategoriesQuery, List<MenuCategoryDto>>
{
    private readonly IAppDbContext _db;

    public GetMenuCategoriesQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<List<MenuCategoryDto>> Handle(
    GetMenuCategoriesQuery request,
    CancellationToken ct)
    {
        // 1. Get Categories
        
        var categories = await _db.MenuCategories
            .AsNoTracking()
            .Where(c => c.RestaurantId == request.RestaurantId
                     && c.DeletedAt == null
                     && c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync(ct);

        // 2. Get Menu Items for those categories
        var categoryIds = categories.Select(c => c.Id).ToList();

        var items = await _db.MenuItems
            .AsNoTracking()
            .Where(i => categoryIds.Contains(i.CategoryId)                     
                     && i.IsAvailable)
            .ToListAsync(ct);

        // 3. Group items by CategoryId
        var itemsGrouped = items
            .GroupBy(i => i.CategoryId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // 4. Map to DTO
        var result = categories.Select(c => new MenuCategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            ImageUrl = c.ImageUrl,
            DisplayOrder = c.DisplayOrder,
            IsActive = c.IsActive,

            Items = itemsGrouped.ContainsKey(c.Id)
                ? itemsGrouped[c.Id].Select(i => new MenuItemDto
                {
                    Id = i.Id,
                    CategoryId = i.CategoryId,
                    Name = i.Name,
                    Description = i.Description,
                    BasePrice = i.BasePrice,
                    ImageUrl = i.ImageUrl,
                    IsAvailable = i.IsAvailable,
                    IsFeatured = i.IsFeatured,
                    PrepTimeMinutes = i.PrepTimeMinutes,

                    // keep empty for now (you can extend later)
                    Variants = new List<ItemVariantDto>(),
                    ModifierGroups = new List<ModifierGroupDto>()
                }).ToList()
                : new List<MenuItemDto>()
        }).ToList();

        return result;
    }
}