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

        Func<DateTime, string> getLabel = request.GroupBy.ToLower() switch
        {
            "month" => d => d.ToString("MMM yyyy"),
            "week"  => d => $"W{System.Globalization.CultureInfo.InvariantCulture.Calendar.GetWeekOfYear(d, System.Globalization.CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday)}-{d.Year}",
            _       => d => d.ToString("dd MMM yyyy")
        };

        var data = orders
            .GroupBy(o => getLabel(o.CreatedAt))
            .Select(g =>
            {
                var gCommission = commissions
                    .Where(c => getLabel(c.CreatedAt) == g.Key)
                    .Sum(c => c.Amount);
                var gPayouts = payouts
                    .Where(p => getLabel(p.CreatedAt) == g.Key)
                    .Sum(p => p.Amount);
                var gRefunds = refunds
                    .Where(r => getLabel(r.CreatedAt) == g.Key)
                    .Sum(r => r.Amount);
                return new FinancialDataPointDto
                {
                    Label = g.Key,
                    Gmv = g.Sum(o => o.TotalAmount),
                    Commission = gCommission,
                    Payouts = gPayouts,
                    Refunds = gRefunds
                };
            }).ToList();

        return new AdminFinancialsReportDto
        {
            FromDate = request.From,
            ToDate = request.To,
            TotalGmv = gmv,
            TotalCommission = totalCommission,
            TotalPayouts = totalPayouts,
            NetRevenue = totalCommission - totalPayouts,
            TotalRefunds = totalRefunds,
            Data = data
        };
    }
}
