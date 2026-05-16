using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Reports;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Reports.Queries.GetVendorOrderReport;

public class GetVendorOrderReportQueryHandler : IRequestHandler<GetVendorOrderReportQuery, VendorOrderReportDto>
{
    private readonly IAppDbContext _db;
    public GetVendorOrderReportQueryHandler(IAppDbContext db) => _db = db;

    public async Task<VendorOrderReportDto> Handle(GetVendorOrderReportQuery request, CancellationToken ct)
    {
        var query = _db.Orders.AsNoTracking()
            .Where(o => o.CreatedAt >= request.From && o.CreatedAt <= request.To);

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
        var total = orders.Count;

        var breakdown = orders
            .GroupBy(o => o.OrderStatus)
            .Select(g => new OrderStatusBreakdownDto
            {
                Status = g.Key.ToString(),
                Count = g.Count(),
                Percentage = total > 0 ? Math.Round((decimal)g.Count() / total * 100, 1) : 0
            }).ToList();

        return new VendorOrderReportDto
        {
            FromDate = request.From,
            ToDate = request.To,
            TotalOrders = total,
            CompletedOrders = orders.Count(o => o.OrderStatus == OrderStatus.Delivered),
            CancelledOrders = orders.Count(o => o.OrderStatus == OrderStatus.Cancelled),
            CancellationRate = total > 0
                ? Math.Round((decimal)orders.Count(o => o.OrderStatus == OrderStatus.Cancelled) / total * 100, 1)
                : 0,
            StatusBreakdown = breakdown
        };
    }
}
