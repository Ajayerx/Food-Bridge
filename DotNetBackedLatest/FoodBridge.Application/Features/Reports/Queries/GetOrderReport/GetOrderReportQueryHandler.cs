// GetOrderReportQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Reports;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Reports.Queries.GetOrderReport;

public class GetOrderReportQueryHandler
    : IRequestHandler<GetOrderReportQuery, OrderReportDto>
{
    private readonly IAppDbContext _db;

    public GetOrderReportQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<OrderReportDto> Handle(
        GetOrderReportQuery request,
        CancellationToken ct)
    {
        // 1. Base query
        var query = _db.Orders
            .AsNoTracking()
            .Where(o => o.CreatedAt >= request.From
                     && o.CreatedAt <= request.To);

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

        // 3. Count by status
        var total = orders.Count;
        var delivered = orders.Count(
            o => o.OrderStatus == OrderStatus.Delivered);
        var cancelled = orders.Count(
            o => o.OrderStatus == OrderStatus.Cancelled);
        var pending = orders.Count(
            o => o.OrderStatus == OrderStatus.Placed
              || o.OrderStatus == OrderStatus.Confirmed
              || o.OrderStatus == OrderStatus.Preparing);
        var refunded = orders.Count(
            o => o.OrderStatus == OrderStatus.Refunded);

        // 4. Status breakdown
        var statusBreakdown = orders
            .GroupBy(o => o.OrderStatus.ToString())
            .Select(g => new OrderStatusBreakdownDto
            {
                Status = g.Key,
                Count = g.Count(),
                Percentage = total > 0
                    ? Math.Round((decimal)g.Count() / total * 100, 1)
                    : 0
            }).ToList();

        // 5. Daily data
        var dailyData = orders
            .GroupBy(o => o.CreatedAt.ToString("dd MMM yyyy"))
            .Select(g => new OrderDataPointDto
            {
                Label = g.Key,
                TotalOrders = g.Count(),
                DeliveredOrders = g.Count(
                    o => o.OrderStatus == OrderStatus.Delivered),
                CancelledOrders = g.Count(
                    o => o.OrderStatus == OrderStatus.Cancelled)
            }).ToList();

        return new OrderReportDto
        {
            FromDate = request.From,
            ToDate = request.To,
            TotalOrders = total,
            DeliveredOrders = delivered,
            CancelledOrders = cancelled,
            PendingOrders = pending,
            RefundedOrders = refunded,
            CancellationRate = total > 0
                ? Math.Round((decimal)cancelled / total * 100, 1)
                : 0,
            CompletionRate = total > 0
                ? Math.Round((decimal)delivered / total * 100, 1)
                : 0,
            StatusBreakdown = statusBreakdown,
            DailyData = dailyData
        };
    }
}