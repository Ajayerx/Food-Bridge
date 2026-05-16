using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Reports;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Reports.Queries.GetVendorDailyReport;

public class GetVendorDailyReportQueryHandler : IRequestHandler<GetVendorDailyReportQuery, VendorDailyReportDto>
{
    private readonly IAppDbContext _db;
    public GetVendorDailyReportQueryHandler(IAppDbContext db) => _db = db;

    public async Task<VendorDailyReportDto> Handle(GetVendorDailyReportQuery request, CancellationToken ct)
    {
        var query = _db.Orders.AsNoTracking()
            .Where(o => o.OrderStatus == OrderStatus.Delivered
                     && o.CreatedAt >= request.From && o.CreatedAt <= request.To);

        if (request.RoleType?.ToLower() == "vendor")
        {
            var vendor = await _db.Vendors.AsNoTracking()
                .FirstOrDefaultAsync(v => v.UserId == request.UserId, ct);

            if (vendor != null)
            {
                if (request.RestaurantId.HasValue)
                    query = query.Where(o => o.RestaurantId == request.RestaurantId.Value);
                else
                    query = query.Where(o => o.Restaurant.VendorId == vendor.Id);
            }
        }
        else if (request.RoleType?.ToLower() == "staff")
        {
            if (request.RestaurantId.HasValue)
                query = query.Where(o => o.RestaurantId == request.RestaurantId.Value);
            else
                query = query.Where(o => o.Id == Guid.Empty);
        }

        var orders = await query.ToListAsync(ct);

        var data = orders
            .GroupBy(o => o.CreatedAt.ToString("yyyy-MM-dd"))
            .OrderBy(g => g.Key)
            .Select(g => new DailyBreakdownDto
            {
                Date = g.Key,
                OrderCount = g.Count(),
                Revenue = g.Sum(o => o.TotalAmount),
                AvgOrderValue = g.Count() > 0 ? Math.Round(g.Sum(o => o.TotalAmount) / g.Count(), 2) : 0
            }).ToList();

        return new VendorDailyReportDto { FromDate = request.From, ToDate = request.To, Data = data };
    }
}
