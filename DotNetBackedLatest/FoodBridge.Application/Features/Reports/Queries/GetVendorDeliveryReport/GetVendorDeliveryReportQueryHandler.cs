using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Reports;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Reports.Queries.GetVendorDeliveryReport;

public class GetVendorDeliveryReportQueryHandler : IRequestHandler<GetVendorDeliveryReportQuery, VendorDeliveryReportDto>
{
    private readonly IAppDbContext _db;
    public GetVendorDeliveryReportQueryHandler(IAppDbContext db) => _db = db;

    public async Task<VendorDeliveryReportDto> Handle(GetVendorDeliveryReportQuery request, CancellationToken ct)
    {
        var taskQuery = _db.DeliveryTasks.AsNoTracking()
            .Include(t => t.Agent).ThenInclude(a => a.User)
            .Include(t => t.Order)
            .Where(t => t.AssignedAt >= request.From && t.AssignedAt <= request.To);

        if (request.RoleType?.ToLower() == "vendor")
        {
            var vendor = await _db.Vendors.AsNoTracking()
                .FirstOrDefaultAsync(v => v.UserId == request.UserId, ct);
            if (vendor != null)
            {
                if (request.RestaurantId.HasValue)
                    taskQuery = taskQuery.Where(t => t.Order.RestaurantId == request.RestaurantId.Value);
                else
                    taskQuery = taskQuery.Where(t => t.Order.Restaurant.VendorId == vendor.Id);
            }
        }
        else if (request.RoleType?.ToLower() == "staff")
        {
            if (request.RestaurantId.HasValue)
                taskQuery = taskQuery.Where(t => t.Order.RestaurantId == request.RestaurantId.Value);
            else
                taskQuery = taskQuery.Where(t => t.Order.Id == Guid.Empty);
        }

        var tasks = await taskQuery.ToListAsync(ct);

        var total = tasks.Count;
        var delivered = tasks.Where(t => t.Status == DeliveryTaskStatus.Delivered).ToList();

        var agentPerf = tasks
            .Where(t => t.DeliveredAt.HasValue)
            .GroupBy(t => new { t.AgentId, t.Agent.User.FullName })
            .Select(g => new AgentPerformanceDto
            {
                AgentId = g.Key.AgentId,
                AgentName = g.Key.FullName ?? string.Empty,
                Deliveries = g.Count(),
                AvgMinutes = g.Where(t => t.DeliveredAt.HasValue)
                    .Average(t => (t.DeliveredAt!.Value - t.AssignedAt).TotalMinutes)
            }).ToList();

        var avgMins = delivered.Any(t => t.DeliveredAt.HasValue)
            ? delivered.Where(t => t.DeliveredAt.HasValue)
                .Average(t => (t.DeliveredAt!.Value - t.AssignedAt).TotalMinutes)
            : 0;

        return new VendorDeliveryReportDto
        {
            FromDate = request.From,
            ToDate = request.To,
            TotalDeliveries = total,
            OnTimeDeliveries = delivered.Count,
            OnTimeRate = total > 0 ? Math.Round((decimal)delivered.Count / total * 100, 1) : 0,
            AvgDeliveryMinutes = Math.Round(avgMins, 1),
            AgentPerformance = agentPerf
        };
    }
}
