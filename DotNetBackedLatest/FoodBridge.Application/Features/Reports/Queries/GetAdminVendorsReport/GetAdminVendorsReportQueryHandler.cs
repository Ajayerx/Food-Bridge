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
        var vendorData = await _db.Vendors.AsNoTracking()
            .Include(v => v.User)
            .Include(v => v.Restaurants)
                .ThenInclude(r => r.Orders)
            .ToListAsync(ct);

        var perf = vendorData.Select(v =>
        {
            var orders = v.Restaurants
                .SelectMany(r => r.Orders)
                .Where(o => o.CreatedAt >= request.From && o.CreatedAt <= request.To
                         && o.OrderStatus == OrderStatus.Delivered)
                .ToList();

            var activeRests = v.Restaurants.Count(r => r.Status == RestaurantStatus.Active);
            var avgRating = v.Restaurants.Any()
                ? v.Restaurants.Average(r => r.AvgRating ?? 0)
                : 0;

            return new VendorPerformanceDto
            {
                VendorId = v.Id,
                VendorName = v.User.FullName ?? v.BusinessName,
                TotalOrders = orders.Count,
                TotalRevenue = orders.Sum(o => o.TotalAmount),
                Commission = 0, // joined separately if needed
                ActiveRestaurants = activeRests,
                AvgRating = Math.Round((decimal)avgRating, 2)
            };
        })
        .OrderByDescending(p => p.TotalRevenue)
        .Take(request.Limit)
        .ToList();

        return new AdminVendorsReportDto { FromDate = request.From, ToDate = request.To, Vendors = perf };
    }
}
