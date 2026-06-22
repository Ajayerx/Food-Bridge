using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Reports;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Reports.Queries.GetAdminVendorsReport;

public class GetAdminVendorsReportQueryHandler : IRequestHandler<GetAdminVendorsReportQuery, AdminVendorsReportDto>
{
    private readonly IAppDbContext _db;
    public GetAdminVendorsReportQueryHandler(IAppDbContext db) => _db = db;

    public async Task<AdminVendorsReportDto> Handle(GetAdminVendorsReportQuery request, CancellationToken ct)
    {
        var orderData = await _db.Orders.AsNoTracking()
            .Where(o => o.CreatedAt >= request.From && o.CreatedAt <= request.To
                     && o.OrderStatus == OrderStatus.Delivered)
            .Select(o => new { o.RestaurantId, o.Restaurant.VendorId, o.TotalAmount })
            .ToListAsync(ct);

        var vendorIds = orderData.Select(o => o.VendorId).Distinct().ToList();
        var vendors = await _db.Vendors.AsNoTracking()
            .Include(v => v.User)
            .Where(v => vendorIds.Contains(v.Id))
            .ToListAsync(ct);
        var vendorMap = vendors.ToDictionary(v => v.Id, v => v.User.FullName ?? v.BusinessName);

        var commissionByVendor = await _db.Commissions.AsNoTracking()
            .Where(c => c.CreatedAt >= request.From && c.CreatedAt <= request.To)
            .GroupBy(c => c.Restaurant.VendorId)
            .Select(g => new { VendorId = g.Key, Amount = g.Sum(c => c.Amount) })
            .ToListAsync(ct);
        var commissionMap = commissionByVendor.ToDictionary(c => c.VendorId, c => c.Amount);

        var restaurants = await _db.Restaurants.AsNoTracking()
            .Where(r => r.DeletedAt == null && vendorIds.Contains(r.VendorId))
            .ToListAsync(ct);
        var restaurantGroup = restaurants.GroupBy(r => r.VendorId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var vendorStats = orderData
            .GroupBy(o => o.VendorId)
            .Select(g =>
            {
                var vendorRestaurants = restaurantGroup.GetValueOrDefault(g.Key) ?? new();
                var activeCount = vendorRestaurants.Count(r => r.Status == RestaurantStatus.Active);
                var avgRating = vendorRestaurants.Any()
                    ? (decimal)vendorRestaurants.Average(r => r.AvgRating ?? 0)
                    : 0m;
                var totalRev = g.Sum(o => o.TotalAmount);
                var comm = commissionMap.GetValueOrDefault(g.Key, 0);

                return new
                {
                    VendorId = g.Key,
                    TotalRevenue = totalRev,
                    TotalOrders = g.Count(),
                    Commission = comm,
                    ActiveRestaurants = activeCount,
                    AvgRating = Math.Round(avgRating, 2)
                };
            })
            .OrderByDescending(p => p.TotalRevenue)
            .ToList();

        var totalCount = vendorStats.Count;
        var page = vendorStats
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var perf = page.Select(p => new VendorPerformanceDto
        {
            VendorId = p.VendorId,
            VendorName = vendorMap.GetValueOrDefault(p.VendorId, "Unknown"),
            TotalOrders = p.TotalOrders,
            TotalRevenue = p.TotalRevenue,
            Commission = p.Commission,
            ActiveRestaurants = p.ActiveRestaurants,
            AvgRating = p.AvgRating
        }).ToList();

        return new AdminVendorsReportDto
        {
            FromDate = request.From,
            ToDate = request.To,
            TotalCount = totalCount,
            Vendors = perf
        };
    }
}
