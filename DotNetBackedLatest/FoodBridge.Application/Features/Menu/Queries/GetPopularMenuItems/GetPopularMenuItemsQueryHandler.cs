using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Menu;
using FoodBridge.Application.Features.Menu.Queries.SearchMenuItems;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Menu.Queries.GetPopularMenuItems;

public class GetPopularMenuItemsQueryHandler : IRequestHandler<GetPopularMenuItemsQuery, List<MenuItemSearchDto>>
{
    private readonly IAppDbContext _db;
    public GetPopularMenuItemsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<List<MenuItemSearchDto>> Handle(GetPopularMenuItemsQuery request, CancellationToken ct)
    {
        var popularItemIds = await _db.OrderItems
            .AsNoTracking()
            .GroupBy(oi => oi.MenuItemId)
            .Select(g => new { MenuItemId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(request.Limit * 3)
            .Select(x => x.MenuItemId)
            .ToListAsync(ct);

        var query = _db.MenuItems
            .AsNoTracking()
            .Include(i => i.Category)
                .ThenInclude(c => c.Restaurant)
            .Where(i =>
                i.DeletedAt == null &&          // ✅ was !i.IsDeleted
                i.IsAvailable &&
                i.Category.IsActive &&
                i.Category.DeletedAt == null && // ✅ was !i.Category.IsDeleted
                popularItemIds.Contains(i.Id));

        if (request.RestaurantId.HasValue)
            query = query.Where(i => i.Category.RestaurantId == request.RestaurantId.Value);

        var items = await query
            .Take(request.Limit)
            .Select(i => new MenuItemSearchDto
            {
                Id = i.Id,
                Name = i.Name,
                Description = i.Description,
                BasePrice = i.BasePrice,
                ImageUrl = i.ImageUrl,
                DietaryTag = i.DietaryTag.ToString(),
                IsAvailable = i.IsAvailable,
                RestaurantId = i.Category.RestaurantId,
                RestaurantName = i.Category.Restaurant.Name,
                RestaurantLogoUrl = i.Category.Restaurant.LogoUrl
            })
            .ToListAsync(ct);

        return items
            .OrderBy(i => popularItemIds.IndexOf(i.Id))
            .ToList();
    }
}