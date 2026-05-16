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
        var monthStart = new DateTime(
            DateTime.UtcNow.Year,
            DateTime.UtcNow.Month, 1);

        // ── Orders ────────────────────────────────────────
        var totalOrders = await _db.Orders
            .CountAsync(ct);

        var todayOrders = await _db.Orders
            .CountAsync(o => o.CreatedAt.Date == today, ct);

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
            .CountAsync(o =>
                o.OrderStatus == OrderStatus.Cancelled, ct);

        // ── Revenue ───────────────────────────────────────
        var totalRevenue = await _db.Orders
            .Where(o => o.PaymentStatus == OrderPaymentStatus.Paid)
            .SumAsync(o => o.TotalAmount, ct);

        var todayRevenue = await _db.Orders
            .Where(o => o.PaymentStatus == OrderPaymentStatus.Paid
                     && o.CreatedAt.Date == today)
            .SumAsync(o => o.TotalAmount, ct);

        var monthRevenue = await _db.Orders
            .Where(o => o.PaymentStatus == OrderPaymentStatus.Paid
                     && o.CreatedAt >= monthStart)
            .SumAsync(o => o.TotalAmount, ct);

        const decimal commissionRate = 0.10m;
        var platformCommission = Math.Round(
            totalRevenue * commissionRate, 2);

        // ── Users ─────────────────────────────────────────
        var totalUsers = await _db.Users
            .CountAsync(
                u => u.DeletedAt == null, ct);

        var totalCustomers = await _db.Customers
            .CountAsync(ct);

        var totalVendors = await _db.Vendors
            .CountAsync(ct);

        var totalAgents = await _db.DeliveryAgents
            .CountAsync(ct);

        var newUsersToday = await _db.Users
            .CountAsync(
                u => u.CreatedAt.Date == today
                  && u.DeletedAt == null, ct);

        var newUsersThisMonth = await _db.Users
            .CountAsync(
                u => u.CreatedAt >= monthStart
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
            .CountAsync(
                t => t.Status == DeliveryTaskStatus.Delivered, ct);

        var activeAgents = await _db.DeliveryAgents
            .CountAsync(
                a => a.Status == AgentStatus.Active, ct);

        var availableAgents = await _db.DeliveryAgents
            .CountAsync(
                a => a.Status == AgentStatus.Active
                  && a.IsAvailable == true, ct);

        // ── Reviews ───────────────────────────────────────
        var totalReviews = await _db.Reviews
            .CountAsync(ct);

        var avgRating = totalReviews > 0
            ? Math.Round(await _db.Reviews
                .AverageAsync(r => (double)r.Rating, ct), 1)
            : 0;

        // ── Orders Chart (last 7 days) ────────────────────
        var last7Days = Enumerable.Range(0, 7)
            .Select(i => today.AddDays(-i))
            .OrderBy(d => d)
            .ToList();

        var recentOrders = await _db.Orders
            .AsNoTracking()
            .Where(o => o.CreatedAt.Date >= today.AddDays(-6))
            .ToListAsync(ct);

        var ordersChart = last7Days.Select(day =>
            new DashboardChartPointDto
            {
                Label = day.ToString("dd MMM"),
                Count = recentOrders.Count(
                    o => o.CreatedAt.Date == day),
                Value = recentOrders
                    .Where(o => o.CreatedAt.Date == day
                             && o.PaymentStatus == OrderPaymentStatus.Paid)
                    .Sum(o => o.TotalAmount)
            }).ToList();

        // ── Revenue Chart (last 7 days) ───────────────────
        var revenueChart = last7Days.Select(day =>
            new DashboardChartPointDto
            {
                Label = day.ToString("dd MMM"),
                Count = recentOrders.Count(
                    o => o.CreatedAt.Date == day
                      && o.PaymentStatus == OrderPaymentStatus.Paid),
                Value = recentOrders
                    .Where(o => o.CreatedAt.Date == day
                             && o.PaymentStatus == OrderPaymentStatus.Paid)
                    .Sum(o => o.TotalAmount)
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
                AvgRating = (decimal)(double)(r.AvgRating ?? 0)
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
            MonthRevenue = monthRevenue,
            PlatformCommission = platformCommission,

            // Users
            TotalUsers = totalUsers,
            TotalCustomers = totalCustomers,
            TotalVendors = totalVendors,
            TotalAgents = totalAgents,
            NewUsersToday = newUsersToday,
            NewUsersThisMonth = newUsersThisMonth,

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

            // Charts
            OrdersChart = ordersChart,
            RevenueChart = revenueChart,
            TopRestaurants = topRestaurants
        };
    }
}