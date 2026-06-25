using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Reports;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Reports.Queries.GetAdminPlatformReport;

public class GetAdminPlatformReportQueryHandler : IRequestHandler<GetAdminPlatformReportQuery, AdminPlatformReportDto>
{
    private readonly IAppDbContext _db;
    public GetAdminPlatformReportQueryHandler(IAppDbContext db) => _db = db;

    public async Task<AdminPlatformReportDto> Handle(GetAdminPlatformReportQuery request, CancellationToken ct)
    {
        var gmv = await _db.Orders.AsNoTracking()
            .Where(o => o.CreatedAt >= request.From && o.CreatedAt < request.To.AddDays(1)
                     && o.PaymentStatus == OrderPaymentStatus.Paid)
            .SumAsync(o => (decimal?)o.TotalAmount, ct) ?? 0;

        var deliveredOrders = await _db.Orders.AsNoTracking()
            .Include(o => o.Restaurant)
            .Where(o => o.CreatedAt >= request.From && o.CreatedAt < request.To.AddDays(1)
                     && o.PaymentStatus == OrderPaymentStatus.Paid)
            .ToListAsync(ct);
        var totalOrders = await _db.Orders.AsNoTracking()
            .CountAsync(o => o.CreatedAt >= request.From && o.CreatedAt < request.To.AddDays(1), ct);
        var commission = await _db.Commissions.AsNoTracking()
            .Where(c => c.CreatedAt >= request.From && c.CreatedAt < request.To.AddDays(1))
            .SumAsync(c => c.Amount, ct);

        var newUsers = await _db.Users.AsNoTracking()
            .CountAsync(u => u.DeletedAt == null && u.CreatedAt >= request.From && u.CreatedAt < request.To.AddDays(1), ct);
        var newVendors = await _db.Vendors.AsNoTracking()
            .CountAsync(v => v.CreatedAt >= request.From && v.CreatedAt < request.To.AddDays(1), ct);
        var activeRestaurants = await _db.Restaurants.AsNoTracking()
            .CountAsync(r => r.DeletedAt == null && r.Status == RestaurantStatus.Active, ct);
        var totalUsers = await _db.Users.AsNoTracking()
            .CountAsync(u => u.DeletedAt == null, ct);
        var totalRestaurants = await _db.Restaurants.AsNoTracking()
            .CountAsync(r => r.DeletedAt == null && r.Status == RestaurantStatus.Active, ct);

        var daysInRange = (request.To - request.From).Days + 1;
        var maxPoints = 31;
        var totalPoints = Math.Min(daysInRange, maxPoints);
        var step = (double)daysInRange / totalPoints;

        var gmvChart = Enumerable.Range(0, totalPoints)
            .Select(i =>
            {
                var startOffset = (int)(i * step);
                var endOffset = i < totalPoints - 1 ? (int)((i + 1) * step) : daysInRange;
                var bucketStart = request.From.Date.AddDays(startOffset);
                var bucketEnd = request.From.Date.AddDays(endOffset);
                var bucketOrders = deliveredOrders
                    .Where(o => o.CreatedAt >= bucketStart && o.CreatedAt < bucketEnd).ToList();
                return new SalesDataPointDto
                {
                    Label = bucketStart.ToString("dd MMM"),
                    Revenue = bucketOrders.Sum(o => o.TotalAmount),
                    OrderCount = bucketOrders.Count,
                };
            }).ToList();

        var revenueByRestaurant = deliveredOrders
            .GroupBy(o => new { o.RestaurantId, Name = o.Restaurant != null ? o.Restaurant.Name : "Unknown" })
            .Select(g => new SalesDataPointDto
            {
                Label = g.Key.Name,
                Revenue = g.Sum(o => o.TotalAmount),
                OrderCount = g.Count()
            })
            .OrderByDescending(x => x.Revenue)
            .ToList();

        var restaurantRevenueMap = deliveredOrders
            .GroupBy(o => o.RestaurantId)
            .ToDictionary(g => g.Key, g => g.Sum(o => o.TotalAmount));

        var commissionByRestaurant = await _db.Commissions.AsNoTracking()
            .Where(c => c.CreatedAt >= request.From && c.CreatedAt < request.To.AddDays(1))
            .GroupBy(c => c.RestaurantId)
            .Select(g => new { RestaurantId = g.Key, Amount = g.Sum(c => c.Amount) })
            .ToListAsync(ct);

        var restaurantIds = restaurantRevenueMap.Keys
            .Union(commissionByRestaurant.Select(c => c.RestaurantId))
            .ToList();

        var restaurants = await _db.Restaurants.AsNoTracking()
            .Where(r => r.DeletedAt == null && restaurantIds.Contains(r.Id))
            .ToListAsync(ct);
        var restaurantNameMap = restaurants.ToDictionary(r => r.Id, r => r.Name);

        var payoutSummary = restaurantIds.Select(id =>
        {
            var grossRev = restaurantRevenueMap.GetValueOrDefault(id, 0);
            var platformFee = commissionByRestaurant.FirstOrDefault(c => c.RestaurantId == id)?.Amount ?? 0;
            return new PayoutSummaryDto
            {
                RestaurantId = id,
                RestaurantName = restaurantNameMap.GetValueOrDefault(id, "Unknown"),
                GrossRevenue = grossRev,
                PlatformFee = platformFee,
                NetPayout = grossRev - platformFee
            };
        })
        .OrderByDescending(p => p.GrossRevenue)
        .ToList();

        var avgOrderValue = deliveredOrders.Count > 0
            ? gmv / deliveredOrders.Count
            : 0;

        return new AdminPlatformReportDto
        {
            FromDate = request.From,
            ToDate = request.To,
            TotalOrders = totalOrders,
            TotalGmv = gmv,
            PlatformRevenue = commission,
            AverageOrderValue = Math.Round(avgOrderValue, 2),
            NewUsers = newUsers,
            NewVendors = newVendors,
            ActiveRestaurants = activeRestaurants,
            TotalUsers = totalUsers,
            TotalRestaurants = totalRestaurants,
            GmvChart = gmvChart,
            RevenueByRestaurant = revenueByRestaurant,
            PayoutSummary = payoutSummary
        };
    }
}
