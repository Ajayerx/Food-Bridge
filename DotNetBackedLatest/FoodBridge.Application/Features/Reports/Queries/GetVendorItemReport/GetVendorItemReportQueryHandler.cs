using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Reports;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Reports.Queries.GetVendorItemReport;

public class GetVendorItemReportQueryHandler : IRequestHandler<GetVendorItemReportQuery, VendorItemReportDto>
{
    private readonly IAppDbContext _db;
    public GetVendorItemReportQueryHandler(IAppDbContext db) => _db = db;

    public async Task<VendorItemReportDto> Handle(GetVendorItemReportQuery request, CancellationToken ct)
    {
        var orderQuery = _db.Orders.AsNoTracking()
            .Where(o => (o.OrderStatus == OrderStatus.Delivered || o.OrderStatus == OrderStatus.Completed)
                     && o.CreatedAt >= request.From && o.CreatedAt < request.To.AddDays(1));

        if (request.RoleType?.ToLower() == "vendor")
        {
            var vendor = await _db.Vendors.AsNoTracking()
                .FirstOrDefaultAsync(v => v.UserId == request.UserId, ct);
            if (vendor != null)
            {
                if (request.RestaurantId.HasValue)
                    orderQuery = orderQuery.Where(o => o.RestaurantId == request.RestaurantId.Value);
                else
                    orderQuery = orderQuery.Where(o => o.Restaurant.VendorId == vendor.Id);
            }
        }
        else if (request.RoleType?.ToLower() == "staff")
        {
            if (request.RestaurantId.HasValue)
                orderQuery = orderQuery.Where(o => o.RestaurantId == request.RestaurantId.Value);
            else
                orderQuery = orderQuery.Where(o => o.Id == Guid.Empty);
        }

        var orderIds = await orderQuery.Select(o => o.Id).ToListAsync(ct);

        var topItems = await _db.OrderItems.AsNoTracking()
            .Include(oi => oi.MenuItem)
            .Where(oi => orderIds.Contains(oi.OrderId))
            .GroupBy(oi => new { oi.MenuItemId, oi.MenuItem.Name, oi.MenuItem.ImageUrl })
            .Select(g => new TopSellingItemDto
            {
                MenuItemId = g.Key.MenuItemId,
                Name = g.Key.Name,
                ImageUrl = g.Key.ImageUrl,
                QuantitySold = g.Sum(x => x.Quantity),
                Revenue = g.Sum(x => x.UnitPriceSnapshot * x.Quantity)
            })
            .OrderByDescending(x => x.QuantitySold)
            .Take(request.Limit)
            .ToListAsync(ct);

        return new VendorItemReportDto { FromDate = request.From, ToDate = request.To, TopItems = topItems };
    }
}
