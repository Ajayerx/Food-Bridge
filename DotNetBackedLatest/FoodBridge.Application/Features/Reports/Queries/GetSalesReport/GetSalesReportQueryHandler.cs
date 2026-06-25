// GetSalesReportQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Reports;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Reports.Queries.GetSalesReport;

public class GetSalesReportQueryHandler
    : IRequestHandler<GetSalesReportQuery, SalesReportDto>
{
    private readonly IAppDbContext _db;

    public GetSalesReportQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<SalesReportDto> Handle(
        GetSalesReportQuery request,
        CancellationToken ct)
    {
        // 1. Base query — delivered orders only
        var query = _db.Orders
            .AsNoTracking()
            .Where(o => (o.OrderStatus == OrderStatus.Delivered
             || o.OrderStatus == OrderStatus.Completed)
                     && o.CreatedAt >= request.From
                     && o.CreatedAt < request.To.AddDays(1));

        // 2. Role-based filter

        if (request.RoleType == "Vendor")
        {
            var vendor = await _db.Vendors
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.UserId == request.UserId, ct);

            if (vendor is not null)
            {
                if (request.RestaurantId.HasValue)
                    query = query.Where(o => o.RestaurantId == request.RestaurantId);
                else
                    query = query.Where(o => o.Restaurant.VendorId == vendor.Id);
            }
        }
        else if (request.RoleType == "Staff")
        {
            if (request.RestaurantId.HasValue)
                query = query.Where(o => o.RestaurantId == request.RestaurantId);
            else
                query = query.Where(o => o.Id == Guid.Empty); 
        }

        var orders = await query.ToListAsync(ct);

        // 3. Aggregate totals
        var paidOrders = orders
            .Where(o => o.PaymentStatus == OrderPaymentStatus.Paid)
            .ToList();

        var totalRevenue = paidOrders.Sum(o => o.TotalAmount);
        var totalOrders = orders.Count;
        var avgOrder = paidOrders.Count > 0
            ? Math.Round(totalRevenue / paidOrders.Count, 2) // paid revenue ÷ paid orders = correct
            : 0;

        // 4. Group data by period
        var dataPoints = request.GroupBy.ToLower() switch
        {
            "week" => orders
                .GroupBy(o => new { o.CreatedAt.Year, Week = GetIso8601WeekOfYear(o.CreatedAt) })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Week)
                .Select(g => new SalesDataPointDto
                {
                    Label = $"W{g.Key.Week:D2}-{g.Key.Year}",
                    Revenue = g.Sum(o => o.TotalAmount),
                    OrderCount = g.Count(),
                    AvgOrderValue = g.Count() > 0
                        ? Math.Round(g.Sum(o => o.TotalAmount) / g.Count(), 2)
                        : 0
                }).ToList(),

            "month" => orders
                .GroupBy(o => new DateTime(o.CreatedAt.Year, o.CreatedAt.Month, 1))
                .OrderBy(g => g.Key)
                .Select(g => new SalesDataPointDto
                {
                    Label = g.Key.ToString("MMM yyyy"),
                    Revenue = g.Sum(o => o.TotalAmount),
                    OrderCount = g.Count(),
                    AvgOrderValue = g.Count() > 0
                        ? Math.Round(g.Sum(o => o.TotalAmount) / g.Count(), 2)
                        : 0
                }).ToList(),

            _ => orders // default: day
                .GroupBy(o => o.CreatedAt.Date)
                .OrderBy(g => g.Key)
                .Select(g => new SalesDataPointDto
                {
                    Label = g.Key.ToString("dd MMM yyyy"),
                    Revenue = g.Sum(o => o.TotalAmount),
                    OrderCount = g.Count(),
                    AvgOrderValue = g.Count() > 0
                        ? Math.Round(g.Sum(o => o.TotalAmount) / g.Count(), 2)
                        : 0
                }).ToList()
        };

        return new SalesReportDto
        {
            FromDate = request.From,
            ToDate = request.To,
            GroupBy = request.GroupBy,
            TotalRevenue = totalRevenue,
            TotalOrders = totalOrders,
            AvgOrderValue = avgOrder,
            Data = dataPoints
        };
    }

    private static int GetIso8601WeekOfYear(DateTime date)
    {
        var day = System.Globalization.CultureInfo
            .InvariantCulture.Calendar
            .GetWeekOfYear(
                date,
                System.Globalization.CalendarWeekRule.FirstFourDayWeek,
                DayOfWeek.Monday);
        return day;
    }
}