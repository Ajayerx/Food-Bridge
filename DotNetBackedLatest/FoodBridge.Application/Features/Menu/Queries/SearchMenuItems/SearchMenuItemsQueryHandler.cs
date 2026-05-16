using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Menu;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Menu.Queries.SearchMenuItems;

public class SearchMenuItemsQueryHandler : IRequestHandler<SearchMenuItemsQuery, SearchMenuItemsResult>
{
    private readonly IAppDbContext _db;
    public SearchMenuItemsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<SearchMenuItemsResult> Handle(SearchMenuItemsQuery request, CancellationToken ct)
    {
        var query = _db.MenuItems
            .AsNoTracking()
            .Include(i => i.Category)
                .ThenInclude(c => c.Restaurant)
            .Where(i =>
                i.DeletedAt == null &&
                i.IsAvailable &&
                i.Category.IsActive &&
                i.Category.DeletedAt == null &&
                i.Category.Restaurant.IsOpen &&                              
                i.Category.Restaurant.Status == RestaurantStatus.Active);   

        if (!string.IsNullOrWhiteSpace(request.Q))
        {
            var q = request.Q.ToLower();
            query = query.Where(i =>
                i.Name.ToLower().Contains(q) ||
                (i.Description != null && i.Description.ToLower().Contains(q)));
        }

        if (request.RestaurantId.HasValue)
            query = query.Where(i => i.Category.RestaurantId == request.RestaurantId.Value);

        if (!string.IsNullOrWhiteSpace(request.DietaryTag) &&
            Enum.TryParse<DietaryTag>(request.DietaryTag, true, out var tagEnum))
            query = query.Where(i => i.DietaryTag == tagEnum);

        if (request.MaxPrice.HasValue)
            query = query.Where(i => i.BasePrice <= request.MaxPrice.Value);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderBy(i => i.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
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
                RestaurantLogoUrl = i.Category.Restaurant.LogoUrl,
                IsOpen = i.Category.Restaurant.IsOpen, 
            })
            .ToListAsync(ct);

        return new SearchMenuItemsResult(items, total);
    }
}