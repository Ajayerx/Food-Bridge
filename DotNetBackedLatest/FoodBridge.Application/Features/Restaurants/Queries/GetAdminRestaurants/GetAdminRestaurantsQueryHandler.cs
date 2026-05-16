using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Restaurants;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Restaurants.Queries.GetAdminRestaurants;

public class GetAdminRestaurantsQueryHandler
    : IRequestHandler<GetAdminRestaurantsQuery, List<RestaurantDto>>
{
    private readonly IAppDbContext _db;

    public GetAdminRestaurantsQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<List<RestaurantDto>> Handle(
        GetAdminRestaurantsQuery request,
        CancellationToken ct)
    {
        var query = _db.Restaurants
            .AsNoTracking()
            .Include(r => r.Vendor)
                .ThenInclude(v => v.User)
            .Where(r => r.DeletedAt == null); 

        if (!string.IsNullOrWhiteSpace(request.Status) &&
            Enum.TryParse<RestaurantStatus>(request.Status, ignoreCase: true, out var parsedStatus))
        {
            query = query.Where(r => r.Status == parsedStatus);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.ToLower();
            query = query.Where(r =>
                r.Name.ToLower().Contains(s) ||
                r.City.ToLower().Contains(s));
        }

        var restaurants = await query
            .OrderByDescending(r => r.CreatedAt)
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
            FssaiLicense = r.FssaiLicense,
            Status = r.Status.ToString(),
            IsOpen = r.IsOpen,
            DeliveryFee = r.DeliveryFee,
            MinOrderAmount = r.MinOrderAmount,
            AvgDeliveryMinutes = r.AvgDeliveryMinutes,
            AvgRating = r.AvgRating,
            TotalRatings = r.TotalRatings,
            CreatedAt = r.CreatedAt,
            VendorName = r.Vendor?.User?.FullName,
            VendorMobile = r.Vendor?.User?.MobileNumber,
            VendorEmail = r.Vendor?.User?.Email,
        }).ToList();
    }
}