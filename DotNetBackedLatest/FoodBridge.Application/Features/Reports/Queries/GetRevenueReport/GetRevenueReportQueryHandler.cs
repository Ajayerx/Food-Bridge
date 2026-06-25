// GetRevenueReportQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Reports;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
namespace FoodBridge.Application.Features.Reports.Queries.GetRevenueReport;

public class GetRevenueReportQueryHandler
    : IRequestHandler<GetRevenueReportQuery, RevenueReportDto>
{
    private readonly IAppDbContext _db;

    public GetRevenueReportQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<RevenueReportDto> Handle(
        GetRevenueReportQuery request,
        CancellationToken ct)
    {
        // Commission rate from PlatformSettings
        string commissionRateStr;
        try
        {
            commissionRateStr = await _db.PlatformSettings
                .Where(s => s.Key == "platform_commission_rate")
                .Select(s => s.Value)
                .FirstOrDefaultAsync(ct) ?? "10";
        }
        catch (System.Data.Common.DbException)
        {
            commissionRateStr = "10";
        }
        var commissionRate = decimal.Parse(commissionRateStr, CultureInfo.InvariantCulture) / 100m;

        // 1. Base query — paid orders only
        var query = _db.Orders
            .AsNoTracking()
            .Where(o => o.PaymentStatus == OrderPaymentStatus.Paid
                     && o.CreatedAt >= request.From
                     && o.CreatedAt < request.To.AddDays(1));

        // 2. Role-based filter
        if (request.RoleType == "Vendor")
        {
            var vendor = await _db.Vendors
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    v => v.UserId == request.UserId, ct);

            if (vendor is not null)
                query = query.Where(
                    o => o.Restaurant.VendorId == vendor.Id);
        }
        else if (request.RestaurantId.HasValue)
        {
            query = query.Where(
                o => o.RestaurantId == request.RestaurantId);
        }

        var orders = await query.ToListAsync(ct);

        // 3. Get order IDs for joins
        var orderIds = orders.Select(o => o.Id).ToList();

        // 4. Get refunds
        var refunds = await _db.Refunds
            .AsNoTracking()
            .Where(r => orderIds.Contains(r.Payment.OrderId))
            .ToListAsync(ct);

        // 5. Aggregate totals
        var grossRevenue = orders.Sum(o => o.TotalAmount);
        var taxCollected = orders.Sum(o => o.TaxAmount);
        var platformCommission = Math.Round(
            grossRevenue * commissionRate, 2);
        var vendorPayout = Math.Round(
            grossRevenue - platformCommission, 2);
        var refundsIssued = refunds.Sum(r => r.Amount);
        var netRevenue = Math.Round(
            platformCommission - refundsIssued, 2);

        // 6. Helper to build data point
        RevenueDataPointDto BuildPoint(
            string label,
            IEnumerable<Domain.Entities.Order> group)
        {
            var gross = group.Sum(o => o.TotalAmount);
            var comm = Math.Round(gross * commissionRate, 2);
            return new RevenueDataPointDto
            {
                Label = label,
                GrossRevenue = gross,
                PlatformCommission = comm,
                VendorPayout = Math.Round(gross - comm, 2),
                NetRevenue = comm
            };
        }

        // 7. Group data by period
        List<RevenueDataPointDto> dataPoints;

        switch (request.GroupBy.ToLower())
        {
            case "month":
                dataPoints = orders
                    .GroupBy(o => o.CreatedAt.ToString("MMM yyyy"))
                    .OrderBy(g => DateTime.ParseExact(
                        g.Key, "MMM yyyy",
                        System.Globalization.CultureInfo.InvariantCulture))
                    .Select(g => BuildPoint(g.Key, g))
                    .ToList();
                break;

            case "week":
                dataPoints = orders
                    .GroupBy(o =>
                        $"{o.CreatedAt.Year}-W" +
                        System.Globalization.ISOWeek
                            .GetWeekOfYear(o.CreatedAt)
                            .ToString("D2"))
                    .OrderBy(g => g.Key)
                    .Select(g => BuildPoint(g.Key, g))
                    .ToList();
                break;

            default: // day
                dataPoints = orders
                    .GroupBy(o => o.CreatedAt.ToString("dd MMM yyyy"))
                    .OrderBy(g => DateTime.ParseExact(
                        g.Key, "dd MMM yyyy",
                        System.Globalization.CultureInfo.InvariantCulture))
                    .Select(g => BuildPoint(g.Key, g))
                    .ToList();
                break;
        }

        return new RevenueReportDto
        {
            FromDate = request.From,
            ToDate = request.To,
            GroupBy = request.GroupBy,
            GrossRevenue = grossRevenue,
            PlatformCommission = platformCommission,
            VendorPayout = vendorPayout,
            TaxCollected = taxCollected,
            RefundsIssued = refundsIssued,
            NetRevenue = netRevenue,
            Data = dataPoints
        };
    }
}