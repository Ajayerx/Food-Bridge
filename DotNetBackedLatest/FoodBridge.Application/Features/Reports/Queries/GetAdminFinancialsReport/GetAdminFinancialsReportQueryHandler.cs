using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Reports;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Reports.Queries.GetAdminFinancialsReport;

public class GetAdminFinancialsReportQueryHandler : IRequestHandler<GetAdminFinancialsReportQuery, AdminFinancialsReportDto>
{
    private readonly IAppDbContext _db;
    public GetAdminFinancialsReportQueryHandler(IAppDbContext db) => _db = db;

    public async Task<AdminFinancialsReportDto> Handle(GetAdminFinancialsReportQuery request, CancellationToken ct)
    {
        var orders = await _db.Orders.AsNoTracking()
            .Where(o => o.CreatedAt >= request.From && o.CreatedAt <= request.To
                     && o.OrderStatus == OrderStatus.Delivered)
            .ToListAsync(ct);
        var commissions = await _db.Commissions.AsNoTracking()
            .Where(c => c.CreatedAt >= request.From && c.CreatedAt <= request.To)
            .ToListAsync(ct);
        var payouts = await _db.VendorPayouts.AsNoTracking()
            .Where(p => p.CreatedAt >= request.From && p.CreatedAt <= request.To
                     && p.Status == PayoutStatus.Completed)
            .ToListAsync(ct);
        var refunds = await _db.Refunds.AsNoTracking()
            .Where(r => r.CreatedAt >= request.From && r.CreatedAt <= request.To
                     && r.Status == RefundStatus.Processed)
            .ToListAsync(ct);

        var gmv = orders.Sum(o => o.TotalAmount);
        var totalCommission = commissions.Sum(c => c.Amount);
        var totalPayouts = payouts.Sum(p => p.Amount);
        var totalRefunds = refunds.Sum(r => r.Amount);

        Func<DateTime, DateTime> getPeriodStart = request.GroupBy.ToLower() switch
        {
            "month" => d => new DateTime(d.Year, d.Month, 1),
            "week" => d =>
            {
                var diff = (7 + (d.DayOfWeek - DayOfWeek.Monday)) % 7;
                return d.Date.AddDays(-(int)diff);
            },
            _ => d => d.Date
        };

        Func<DateTime, string> getLabel = d => request.GroupBy.ToLower() switch
        {
            "month" => d.ToString("MMM yyyy"),
            "week" => $"W{System.Globalization.CultureInfo.InvariantCulture.Calendar.GetWeekOfYear(d, System.Globalization.CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday)}-{d.Year}",
            _ => d.ToString("dd MMM yyyy")
        };

        var allPeriods = orders.Select(o => getPeriodStart(o.CreatedAt))
            .Union(commissions.Select(c => getPeriodStart(c.CreatedAt)))
            .Union(payouts.Select(p => getPeriodStart(p.CreatedAt)))
            .Union(refunds.Select(r => getPeriodStart(r.CreatedAt)))
            .Distinct()
            .OrderBy(d => d)
            .ToList();

        var data = allPeriods.Select(period =>
        {
            var periodOrders = orders.Where(o => getPeriodStart(o.CreatedAt) == period).ToList();
            var periodCommissions = commissions.Where(c => getPeriodStart(c.CreatedAt) == period).ToList();
            var periodPayouts = payouts.Where(p => getPeriodStart(p.CreatedAt) == period).ToList();
            var periodRefunds = refunds.Where(r => getPeriodStart(r.CreatedAt) == period).ToList();

            return new FinancialDataPointDto
            {
                Label = getLabel(period),
                Gmv = periodOrders.Sum(o => o.TotalAmount),
                Commission = periodCommissions.Sum(c => c.Amount),
                Payouts = periodPayouts.Sum(p => p.Amount),
                Refunds = periodRefunds.Sum(r => r.Amount)
            };
        }).ToList();

        return new AdminFinancialsReportDto
        {
            FromDate = request.From,
            ToDate = request.To,
            TotalGmv = gmv,
            TotalCommission = totalCommission,
            TotalPayouts = totalPayouts,
            NetRevenue = totalCommission - totalPayouts - totalRefunds,
            TotalRefunds = totalRefunds,
            Data = data
        };
    }
}
