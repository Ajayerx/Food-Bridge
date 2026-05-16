using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Restaurants;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Restaurants.Queries.SearchRestaurants;

public class SearchRestaurantsQueryHandler : IRequestHandler<SearchRestaurantsQuery, SearchRestaurantsResult>
{
    private readonly IAppDbContext _db;
    public SearchRestaurantsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<SearchRestaurantsResult> Handle(SearchRestaurantsQuery request, CancellationToken ct)
    {
        var query = _db.Restaurants
            .AsNoTracking()
            .Where(r => r.DeletedAt == null && r.Status == RestaurantStatus.Active);

        if (!string.IsNullOrWhiteSpace(request.Q))
        {
            var q = request.Q.ToLower();
            query = query.Where(r =>
                r.Name.ToLower().Contains(q) ||
                (r.Description != null && r.Description.ToLower().Contains(q)) ||
                r.City.ToLower().Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(request.City))
            query = query.Where(r => r.City.ToLower() == request.City.ToLower());

        if (request.IsOpen.HasValue)
            query = query.Where(r => r.IsOpen == request.IsOpen.Value);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(r => r.AvgRating)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new RestaurantDto
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
                CreatedAt = r.CreatedAt
            })
            .ToListAsync(ct);

        return new SearchRestaurantsResult(items, total);
    }
}
