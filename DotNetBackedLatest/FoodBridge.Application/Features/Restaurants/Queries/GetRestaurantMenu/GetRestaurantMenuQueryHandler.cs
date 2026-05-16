using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Menu;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Restaurants.Queries.GetRestaurantMenu;

public class GetRestaurantMenuQueryHandler : IRequestHandler<GetRestaurantMenuQuery, List<MenuCategoryDto>>
{
    private readonly IAppDbContext _db;
    public GetRestaurantMenuQueryHandler(IAppDbContext db) => _db = db;

    public async Task<List<MenuCategoryDto>> Handle(GetRestaurantMenuQuery request, CancellationToken ct)
    {
        var exists = await _db.Restaurants
            .AnyAsync(r => r.Id == request.RestaurantId && r.DeletedAt == null, ct);
        if (!exists)
            throw new NotFoundException("Restaurant not found.");

        var categories = await _db.MenuCategories
            .AsNoTracking()
            .Where(c => c.RestaurantId == request.RestaurantId
                     && c.IsActive
                     && c.DeletedAt == null)
            .OrderBy(c => c.DisplayOrder)
            .Include(c => c.MenuItems.Where(i => i.IsAvailable && i.DeletedAt == null))
                .ThenInclude(i => i.Variants)
            .Include(c => c.MenuItems.Where(i => i.IsAvailable && i.DeletedAt == null))
                .ThenInclude(i => i.ModifierGroups)
                    .ThenInclude(mg => mg.Options)
            .ToListAsync(ct);

        return categories.Select(c => new MenuCategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            ImageUrl = c.ImageUrl,
            DisplayOrder = c.DisplayOrder,
            IsActive = c.IsActive,
            Items = c.MenuItems.Select(i => new MenuItemDto
            {
                Id = i.Id,
                CategoryId = i.CategoryId,
                Name = i.Name,
                Description = i.Description,
                BasePrice = i.BasePrice,
                ImageUrl = i.ImageUrl,
                DietaryTag = i.DietaryTag.ToString(),
                IsAvailable = i.IsAvailable,
                IsFeatured = i.IsFeatured,
                PrepTimeMinutes = i.PrepTimeMinutes
            }).ToList()
        }).ToList();
    }
}