using System.Text.Json;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Admin;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Admin.Queries.GetAllVendors;

public class GetAllVendorsQueryHandler
    : IRequestHandler<GetAllVendorsQuery, VendorListResult>
{
    private readonly IAppDbContext _db;

    public GetAllVendorsQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<VendorListResult> Handle(
        GetAllVendorsQuery request,
        CancellationToken ct)
    {
        var query = _db.Vendors
            .AsNoTracking()
            .Include(v => v.User)
            .Include(v => v.Restaurants)
            .Where(v => v.User.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(request.Status)
         && Enum.TryParse<VendorStatus>(request.Status, ignoreCase: true, out var parsedStatus))
        {
            query = query.Where(v => v.Status == parsedStatus);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.ToLower();
            query = query.Where(v =>
                v.BusinessName.ToLower().Contains(s) ||
                v.User.FullName!.Contains(s) ||
                v.User.MobileNumber.Contains(s));
        }

        var totalCount = await query.CountAsync(ct);

        var vendors = await query
            .OrderByDescending(v => v.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        return new VendorListResult
        {
            TotalCount = totalCount,
            Items = vendors.Select(v => new AdminVendorDto
            {
                Id = v.Id,
                BusinessName = v.BusinessName,
                Status = v.Status.ToString(),
                ApprovedAt = v.ApprovedAt,

                UserName = v.User?.FullName,
                MobileNumber = v.User?.MobileNumber ?? string.Empty,
                Email = v.User?.Email,

                RestaurantCount = v.Restaurants.Count,
                RestaurantNames = string.Join(", ", v.Restaurants.Select(r => r.Name)),
                VendorRestaurants = v.Restaurants.Select(r => new AdminVendorRestaurantDto
                {
                    Name = r.Name,
                    Description = r.Description,
                    Cuisines = r.Cuisines is not null
                        ? JsonSerializer.Deserialize<List<string>>(r.Cuisines)
                        : null,
                    OperatingHours = DeserializeOperatingHours(r.OperatingHours),
                    AddressLine = r.AddressLine,
                    City = r.City,
                    State = r.State,
                    PinCode = r.PinCode,
                    PhoneNumber = r.PhoneNumber,
                    FssaiLicense = r.FssaiLicense,
                    Status = r.Status.ToString(),
                    RejectionReason = r.RejectionReason,
                    DeliveryFee = r.DeliveryFee,
                    MinOrderAmount = r.MinOrderAmount,
                    AvgPrepMinutes = r.AvgPrepMinutes,
                    IsPureVeg = r.IsPureVeg,
                    IsDineInEnabled = r.IsDineInEnabled,
                    IsTakeawayEnabled = r.IsTakeawayEnabled,
                    IsDeliveryEnabled = r.IsDeliveryEnabled,
                }).ToList(),

                GstNumber = v.GstNumber,
                PanNumber = v.PanNumber,
                BankAccountNumber = v.BankAccountNumber,
                BankIfscCode = v.BankIfscCode,
                BankHolderName = v.BankHolderName,

                CreatedAt = v.CreatedAt,
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
