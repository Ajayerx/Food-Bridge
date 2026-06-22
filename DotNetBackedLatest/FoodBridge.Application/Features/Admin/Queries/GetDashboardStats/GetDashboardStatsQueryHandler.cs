// GetDashboardStatsQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Admin;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Admin.Queries.GetDashboardStats;

public class GetDashboardStatsQueryHandler
    : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    private readonly IAppDbContext _db;

    public GetDashboardStatsQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<DashboardStatsDto> Handle(
        GetDashboardStatsQuery request,
        CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        var periodStart = request.From.Date;
        var periodEnd = request.To.Date;
        var daysInPeriod = (periodEnd - periodStart).Days + 1;

        // ── Lifetime Orders ───────────────────────────────
        var totalOrders = await _db.Orders.CountAsync(ct);

        var totalRevenue = await _db.Orders
            .Where(o => o.PaymentStatus == OrderPaymentStatus.Paid)
            .SumAsync(o => o.TotalAmount, ct);

        var completedOrders = await _db.Orders
            .CountAsync(o =>
                o.OrderStatus == OrderStatus.Delivered
             || o.OrderStatus == OrderStatus.Completed, ct);

        // ── Period Orders ─────────────────────────────────
        var periodOrders = await _db.Orders
            .Where(o => o.CreatedAt >= periodStart
                     && o.CreatedAt <= periodEnd.AddDays(1))
            .ToListAsync(ct);

        var periodOrderCount = periodOrders.Count;
        var periodPaidOrders = periodOrders
            .Where(o => o.PaymentStatus == OrderPaymentStatus.Paid).ToList();
        var periodRevenue = periodPaidOrders.Sum(o => o.TotalAmount);
        var periodCompletedOrders = periodOrders
            .Count(o => o.OrderStatus == OrderStatus.Delivered
                     || o.OrderStatus == OrderStatus.Completed);

        // ── Today Orders ──────────────────────────────────
        var todayOrders = await _db.Orders
            .CountAsync(o => o.CreatedAt.Date == today, ct);

        var todayRevenue = await _db.Orders
            .Where(o => o.PaymentStatus == OrderPaymentStatus.Paid
                     && o.CreatedAt.Date == today)
            .SumAsync(o => o.TotalAmount, ct);

        // ── Order status breakdown (lifetime) ─────────────
        var pendingOrders = await _db.Orders
            .CountAsync(o =>
                o.OrderStatus == OrderStatus.Placed
             || o.OrderStatus == OrderStatus.Confirmed
             || o.OrderStatus == OrderStatus.Preparing, ct);

        var activeOrders = await _db.Orders
            .CountAsync(o =>
                o.OrderStatus == OrderStatus.OutForDelivery
             || o.OrderStatus == OrderStatus.ReadyForPickup, ct);

        var cancelledOrders = await _db.Orders
            .CountAsync(o => o.OrderStatus == OrderStatus.Cancelled, ct);

        // ── Revenue metrics ───────────────────────────────
        const decimal commissionRate = 0.10m;
        var platformCommission = Math.Round(
            periodRevenue * commissionRate, 2);

        var avgOrderValue = periodPaidOrders.Count > 0
            ? Math.Round(periodRevenue / periodPaidOrders.Count, 2)
            : 0;

        // ── Users ─────────────────────────────────────────
        var totalUsers = await _db.Users
            .CountAsync(u => u.DeletedAt == null, ct);

        var totalCustomers = await _db.Customers.CountAsync(ct);
        var totalVendors = await _db.Vendors.CountAsync(ct);
        var totalAgents = await _db.DeliveryAgents.CountAsync(ct);

        var newUsersToday = await _db.Users
            .CountAsync(u => u.CreatedAt.Date == today
                          && u.DeletedAt == null, ct);

        var newUsersInPeriod = await _db.Users
            .CountAsync(u => u.CreatedAt >= periodStart
                          && u.CreatedAt <= periodEnd.AddDays(1)
                          && u.DeletedAt == null, ct);

        // ── Restaurants ───────────────────────────────────
        var totalRestaurants = await _db.Restaurants
            .CountAsync(r => r.DeletedAt == null, ct);

        var activeRestaurants = await _db.Restaurants
            .CountAsync(r =>
                r.Status == RestaurantStatus.Active
             && r.DeletedAt == null, ct);

        var pendingRestaurants = await _db.Restaurants
            .CountAsync(r =>
                r.Status == RestaurantStatus.Pending
             && r.DeletedAt == null, ct);

        // ── Delivery ──────────────────────────────────────
        var totalDeliveries = await _db.DeliveryTasks
            .CountAsync(t => t.Status == DeliveryTaskStatus.Delivered, ct);

        var activeAgents = await _db.DeliveryAgents
            .CountAsync(a => a.Status == AgentStatus.Active, ct);

        var availableAgents = await _db.DeliveryAgents
            .CountAsync(a => a.Status == AgentStatus.Active
                          && a.IsAvailable == true, ct);

        // ── Reviews ───────────────────────────────────────
        var totalReviews = await _db.Reviews.CountAsync(ct);

        var avgRating = totalReviews > 0
            ? Math.Round(await _db.Reviews
                .AverageAsync(r => (double)r.Rating, ct), 1)
            : 0;

        // ── Fulfillment ───────────────────────────────────
        var fulfillmentRate = periodOrderCount > 0
            ? Math.Round((double)periodCompletedOrders / periodOrderCount * 100, 1)
            : 0;

        // ── Charts (daily across period, max 31 bars) ─────
        var chartDays = Math.Min(daysInPeriod, 31);
        var step = Math.Max(1, daysInPeriod / chartDays);

        var chartDates = Enumerable.Range(0, chartDays)
            .Select(i => periodStart.AddDays(i * step))
            .ToList();

        var ordersChart = chartDates.Select(day =>
        {
            var dayOrders = periodOrders
                .Where(o => o.CreatedAt.Date == day).ToList();
            return new DashboardChartPointDto
            {
                Label = day.ToString("dd MMM"),
                Count = dayOrders.Count,
                Value = dayOrders
                    .Where(o => o.PaymentStatus == OrderPaymentStatus.Paid)
                    .Sum(o => o.TotalAmount)
            };
        }).ToList();

        // Revenue chart: same daily data, frontend uses Value
        var revenueChart = chartDates.Select(day =>
        {
            var dayPaid = periodOrders
                .Where(o => o.CreatedAt.Date == day
                         && o.PaymentStatus == OrderPaymentStatus.Paid).ToList();
            return new DashboardChartPointDto
            {
                Label = day.ToString("dd MMM"),
                Count = dayPaid.Count,
                Value = dayPaid.Sum(o => o.TotalAmount)
            };
        }).ToList();

        // ── Top Restaurants ───────────────────────────────
        var topRestaurants = await _db.Restaurants
            .AsNoTracking()
            .Where(r => r.DeletedAt == null)
            .OrderByDescending(r => r.TotalRatings)
            .ThenByDescending(r => r.AvgRating)
            .Take(5)
            .Select(r => new TopRestaurantDto
            {
                Id = r.Id,
                Name = r.Name,
                LogoUrl = r.LogoUrl,
                TotalOrders = r.Orders.Count,
                TotalRevenue = r.Orders
                    .Where(o => o.PaymentStatus == OrderPaymentStatus.Paid)
                    .Sum(o => o.TotalAmount),
                AvgRating = r.AvgRating ?? 0
            })
            .ToListAsync(ct);

        return new DashboardStatsDto
        {
            // Orders
            TotalOrders = totalOrders,
            TodayOrders = todayOrders,
            PendingOrders = pendingOrders,
            ActiveOrders = activeOrders,
            CancelledOrders = cancelledOrders,

            // Revenue
            TotalRevenue = totalRevenue,
            TodayRevenue = todayRevenue,
            MonthRevenue = periodRevenue,
            PlatformCommission = platformCommission,
            AverageOrderValue = avgOrderValue,

            // Users
            TotalUsers = totalUsers,
            TotalCustomers = totalCustomers,
            TotalVendors = totalVendors,
            TotalAgents = totalAgents,
            NewUsersToday = newUsersToday,
            NewUsersThisMonth = newUsersInPeriod,

            // Restaurants
            TotalRestaurants = totalRestaurants,
            ActiveRestaurants = activeRestaurants,
            PendingRestaurants = pendingRestaurants,

            // Delivery
            TotalDeliveries = totalDeliveries,
            ActiveAgents = activeAgents,
            AvailableAgents = availableAgents,

            // Reviews
            TotalReviews = totalReviews,
            AvgPlatformRating = (decimal)avgRating,

            // Fulfillment
            FulfillmentRate = fulfillmentRate,

            // Charts
            OrdersChart = ordersChart,
            RevenueChart = revenueChart,
            TopRestaurants = topRestaurants
        };
    }
}