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
        var orders = await _db.Orders.AsNoTracking()
            .Where(o => o.CreatedAt >= request.From && o.CreatedAt <= request.To)
            .ToListAsync(ct);

        var deliveredOrders = orders.Where(o => o.OrderStatus == OrderStatus.Delivered).ToList();
        var gmv = deliveredOrders.Sum(o => o.TotalAmount);
        var commission = await _db.Commissions.AsNoTracking()
            .Where(c => c.CreatedAt >= request.From && c.CreatedAt <= request.To)
            .SumAsync(c => c.Amount, ct);

        var newUsers = await _db.Users.AsNoTracking()
            .CountAsync(u => u.CreatedAt >= request.From && u.CreatedAt <= request.To, ct);
        var newVendors = await _db.Vendors.AsNoTracking()
            .CountAsync(v => v.CreatedAt >= request.From && v.CreatedAt <= request.To, ct);
        var activeRestaurants = await _db.Restaurants.AsNoTracking()
            .CountAsync(r => r.Status == RestaurantStatus.Active, ct);

        var chart = deliveredOrders
            .GroupBy(o => o.CreatedAt.ToString("dd MMM yyyy"))
            .Select(g => new SalesDataPointDto
            {
                Label = g.Key,
                Revenue = g.Sum(o => o.TotalAmount),
                OrderCount = g.Count()
            }).ToList();

        return new AdminPlatformReportDto
        {
            FromDate = request.From,
            ToDate = request.To,
            TotalOrders = orders.Count,
            TotalGmv = gmv,
            PlatformRevenue = commission,
            NewUsers = newUsers,
            NewVendors = newVendors,
            ActiveRestaurants = activeRestaurants,
            GmvChart = chart
        };
    }
}
