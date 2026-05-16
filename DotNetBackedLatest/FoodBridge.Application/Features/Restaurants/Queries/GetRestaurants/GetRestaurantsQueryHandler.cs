// GetRestaurantsQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Restaurants;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Restaurants.Queries.GetRestaurants;

public class GetRestaurantsQueryHandler
    : IRequestHandler<GetRestaurantsQuery, List<RestaurantDto>>
{
    private readonly IAppDbContext _db;

    public GetRestaurantsQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<List<RestaurantDto>> Handle(
    GetRestaurantsQuery request,
    CancellationToken ct)
    {
        var query = _db.Restaurants
            .AsNoTracking()
            .Where(r => r.DeletedAt == null
                     && r.Status == RestaurantStatus.Active);

        // ── Existing filters ───────────────────────────────────────────────
        if (!string.IsNullOrWhiteSpace(request.City))
            query = query.Where(r =>
                r.City.ToLower() == request.City.ToLower());

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(r =>
                r.Name.Contains(request.Search));

        // ── New filters ────────────────────────────────────────────────────

        // 🥗 Pure Veg
        if (request.IsPureVeg == true)
            query = query.Where(r => r.IsPureVeg);

        // ⭐ Top Rated (4.0+)
        if (request.MinRating.HasValue)
            query = query.Where(r =>
                r.AvgRating.HasValue && r.AvgRating >= request.MinRating.Value);

        // ⚡ Fast Delivery
        if (request.MaxPrepTime.HasValue)
            query = query.Where(r =>
                r.AvgDeliveryMinutes <= request.MaxPrepTime.Value);

        // 💰 Budget (avg menu item price <= maxCost)
        if (request.MaxCost.HasValue)
            query = query.Where(r =>
                r.MenuCategories
                    .SelectMany(mc => mc.MenuItems)
                    .Where(mi => mi.DeletedAt == null && mi.IsAvailable)
                    .Average(mi => (decimal?)mi.BasePrice) <= request.MaxCost.Value);

        // 🔥 Popular (well rated)
        if (request.Popular == true)
            query = query.Where(r =>
                r.AvgRating.HasValue && r.AvgRating >= 3.5m);

        // 🆕 New (created in last 30 days)
        if (request.IsNew == true)
            query = query.Where(r =>
                r.CreatedAt >= DateTime.UtcNow.AddDays(-30));

        // ── Sorting ────────────────────────────────────────────────────────
        query = request.SortBy switch
        {
            "newest" => query.OrderByDescending(r => r.CreatedAt),
            "popular" => query.OrderByDescending(r => r.AvgRating)
                             .ThenByDescending(r => r.TotalRatings),
            _ => query.OrderByDescending(r => r.AvgRating)
                             .ThenByDescending(r => r.TotalRatings)
        };

        var restaurants = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        return restaurants.Select(r => new RestaurantDto
        {
            Id = r.Id,
            Name = r.Name,
            Description = r.Description,
            LogoUrl = r.LogoUrl,
            CoverImageUrl = r.CoverImageUrl,
            AddressLine = r.AddressLine,
            City = r.City,
            State = r.State,
            PinCode = r.PinCode,
            Latitude = r.Latitude,
            Longitude = r.Longitude,
            PhoneNumber = r.PhoneNumber,
            Status = r.Status.ToString(),
            IsOpen = r.IsOpen,
            DeliveryFee = r.DeliveryFee,
            MinOrderAmount = r.MinOrderAmount,
            AvgDeliveryMinutes = r.AvgDeliveryMinutes,
            AvgRating = r.AvgRating,
            TotalRatings = r.TotalRatings,
            CreatedAt = r.CreatedAt,
            IsPureVeg = r.IsPureVeg,   // ✅ only new field
        }).ToList();
    }

}