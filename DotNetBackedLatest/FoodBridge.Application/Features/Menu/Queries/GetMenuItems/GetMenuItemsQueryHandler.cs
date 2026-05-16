// GetMenuItemsQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Menu;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Menu.Queries.GetMenuItems;

public class GetMenuItemsQueryHandler
    : IRequestHandler<GetMenuItemsQuery, List<MenuItemDto>>
{
    private readonly IAppDbContext _db;

    public GetMenuItemsQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<List<MenuItemDto>> Handle(
        GetMenuItemsQuery request,
        CancellationToken ct)
    {
        var query = _db.MenuItems
            .AsNoTracking()
            .Include(i => i.Category)
            .Include(i => i.Variants)
            .Include(i => i.ModifierGroups)
                .ThenInclude(g => g.Options)
            .Where(i => i.Category.RestaurantId == request.RestaurantId
                     && i.DeletedAt == null);

        if (request.CategoryId.HasValue)
            query = query.Where(
                i => i.CategoryId == request.CategoryId.Value);

        var items = await query
            .OrderBy(i => i.Category.DisplayOrder)
            .ThenBy(i => i.Name)
            .ToListAsync(ct);

        return items.Select(i => new MenuItemDto
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
            PrepTimeMinutes = i.PrepTimeMinutes,
            Variants = i.Variants.Select(v => new ItemVariantDto
            {
                Id = v.Id,
                Name = v.Name,
                Price = v.Price,
                IsAvailable = v.IsAvailable
            }).ToList(),
            ModifierGroups = i.ModifierGroups.Select(g => new ModifierGroupDto
            {
                Id = g.Id,
                Name = g.Name,
                IsRequired = g.IsRequired,
                MaxSelections = g.MaxSelections,
                Options = g.Options.Select(o => new ModifierOptionDto
                {
                    Id = o.Id,
                    Name = o.Name,
                    AdditionalPrice = o.AdditionalPrice,
                    IsAvailable = o.IsAvailable
                }).ToList()
            }).ToList()
        }).ToList();
    }
}