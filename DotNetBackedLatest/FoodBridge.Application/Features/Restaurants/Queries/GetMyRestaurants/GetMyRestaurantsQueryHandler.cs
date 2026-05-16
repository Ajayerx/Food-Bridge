using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Restaurants;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Restaurants.Queries.GetMyRestaurants;

public class GetMyRestaurantsQueryHandler : IRequestHandler<GetMyRestaurantsQuery, List<RestaurantDto>>
{
    private readonly IAppDbContext _db;
    public GetMyRestaurantsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<List<RestaurantDto>> Handle(GetMyRestaurantsQuery request, CancellationToken ct)
    {
        // Staff: return the single restaurant they are assigned to
        if (request.RoleType?.ToLower() == "staff")
        {
            var staffUser = await _db.StaffUsers
                .AsNoTracking()
                .Include(s => s.Restaurant)
                .FirstOrDefaultAsync(s => s.UserId == request.UserId, ct);

            if (staffUser?.Restaurant is null)
                return new List<RestaurantDto>();

            return new List<RestaurantDto> { MapToDto(staffUser.Restaurant) };
        }

        // Vendor: return all their restaurants
        var vendor = await _db.Vendors
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.UserId == request.UserId, ct);

        if (vendor is null)
            return new List<RestaurantDto>();

        return await _db.Restaurants
            .AsNoTracking()
            .Where(r => r.VendorId == vendor.Id && r.DeletedAt == null)
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
    }

    private static RestaurantDto MapToDto(Domain.Entities.Restaurant r) => new()
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
    };
}
