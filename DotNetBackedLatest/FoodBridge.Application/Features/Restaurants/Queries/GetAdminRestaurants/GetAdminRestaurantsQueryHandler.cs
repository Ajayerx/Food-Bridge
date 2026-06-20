using System.Text.Json;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Admin;
using FoodBridge.Application.DTOs.Restaurants;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Restaurants.Queries.GetAdminRestaurants;

public class GetAdminRestaurantsQueryHandler
    : IRequestHandler<GetAdminRestaurantsQuery, RestaurantListResult>
{
    private readonly IAppDbContext _db;

    public GetAdminRestaurantsQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<RestaurantListResult> Handle(
        GetAdminRestaurantsQuery request,
        CancellationToken ct)
    {
        var query = _db.Restaurants
            .AsNoTracking()
            .Include(r => r.Vendor)
                .ThenInclude(v => v.User)
            .Where(r => r.DeletedAt == null && r.Vendor.Status == VendorStatus.Approved); 

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

        var totalCount = await query.CountAsync(ct);

        var restaurants = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        return new RestaurantListResult
        {
            TotalCount = totalCount,
            Items = restaurants.Select(r => new RestaurantDto
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
                RejectionReason = r.RejectionReason,
                Status = r.Status.ToString(),
                IsOpen = r.IsOpen,
                DeliveryFee = r.DeliveryFee,
                MinOrderAmount = r.MinOrderAmount,
                AvgDeliveryMinutes = r.AvgDeliveryMinutes,
                AvgRating = r.AvgRating,
                TotalRatings = r.TotalRatings,
                IsPureVeg = r.IsPureVeg,
                Cuisines = r.Cuisines is not null
                    ? JsonSerializer.Deserialize<List<string>>(r.Cuisines)
                    : null,
                OperatingHours = DeserializeOperatingHours(r.OperatingHours),
                CreatedAt = r.CreatedAt,
                VendorId = r.VendorId,
                VendorName = r.Vendor?.User?.FullName,
                VendorMobile = r.Vendor?.User?.MobileNumber,
                VendorEmail = r.Vendor?.User?.Email,
            }).ToList(),
        };
    }

    private static List<OperatingHoursDto>? DeserializeOperatingHours(string? raw)
    {
        if (raw is null) return null;

        var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(raw);
        if (dict is null || dict.Count == 0) return null;

        return dict.Select(kvp => new OperatingHoursDto
        {
            Day = kvp.Key,
            Open = kvp.Value.TryGetProperty("open", out var open) ? open.GetString() ?? "" : "",
            Close = kvp.Value.TryGetProperty("close", out var close) ? close.GetString() ?? "" : "",
            Closed = kvp.Value.TryGetProperty("closed", out var closed) && closed.GetBoolean(),
        }).ToList();
    }
}