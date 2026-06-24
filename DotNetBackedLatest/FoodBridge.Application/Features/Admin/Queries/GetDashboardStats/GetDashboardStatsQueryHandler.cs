using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Admin;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace FoodBridge.Application.Features.Admin.Queries.GetDashboardStats;

public class GetDashboardStatsQueryHandler
    : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    private readonly IAppDbContext _db;
    private readonly ICacheService _cache;

    public GetDashboardStatsQueryHandler(IAppDbContext db, ICacheService cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<DashboardStatsDto> Handle(
        GetDashboardStatsQuery request,
        CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        var periodStart = request.From;
        var periodEnd = request.To;
        var daysInPeriod = (periodEnd - periodStart).Days + 1;

        // ── Cache check (FIX-04) ────────────────────────────
        var cacheKey = $"admin-dashboard:{periodStart:yyyy-MM-dd}:{periodEnd:yyyy-MM-dd}";
        var cached = await _cache.GetAsync<DashboardStatsDto>(cacheKey, ct);
        if (cached is not null) return cached;

        // ── Aggregate queries (FIX-02: parallel LINQ) ──────
        var periodEndParam = periodEnd.AddDays(1);
        var agg = await AggregateAllAsync(periodStart, periodEndParam, ct);

        var periodRev = agg.PeriodRevenue;
        var periodCompleted = agg.PeriodCompletedOrders;
        var periodCancelled = agg.PeriodCancelledOrders;
        var periodPaid = agg.PeriodPaidOrders;
        var periodOrderCount = agg.PeriodOrderCount;

        // ── Commission rate from PlatformSettings (FIX-06) ──
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

        var platformCommission = Math.Round(periodRev * commissionRate, 2);

        var avgOrderValue = periodPaid > 0
            ? Math.Round(periodRev / periodPaid, 2)
            : 0;

        // ── Fulfillment (FIX-05) ──────────────────────────
        var settledOrders = periodCompleted + periodCancelled;
        var fulfillmentRate = settledOrders > 0
            ? Math.Round((double)periodCompleted / settledOrders * 100, 1)
            : 0;

        // ── Period orders for chart building ───────────────
        var periodOrders = await _db.Orders.AsNoTracking()
            .Where(o => o.CreatedAt >= periodStart && o.CreatedAt < periodEndParam)
            .Select(o => new { o.CreatedAt, o.TotalAmount, o.OrderStatus, o.PaymentStatus })
            .ToListAsync(ct);

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
            .OrderByDescending(r => r.Orders
                .Where(o => o.PaymentStatus == OrderPaymentStatus.Paid)
                .Sum(o => o.TotalAmount))
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

        var result = new DashboardStatsDto
        {
            // Orders
            TotalOrders = agg.TotalOrders,
            TodayOrders = agg.TodayOrders,
            PendingOrders = agg.PendingOrders,
            ActiveOrders = agg.ActiveOrders,
            CancelledOrders = agg.CancelledOrders,

            // Revenue
            TotalRevenue = agg.TotalRevenue,
            TodayRevenue = agg.TodayRevenue,
            PeriodRevenue = periodRev,
            PlatformCommission = platformCommission,
            AverageOrderValue = avgOrderValue,

            // Users
            TotalUsers = agg.TotalUsers,
            TotalCustomers = agg.TotalCustomers,
            TotalVendors = agg.TotalVendors,
            TotalAgents = agg.TotalAgents,
            NewUsersToday = agg.NewUsersToday,
            NewUsersThisMonth = agg.NewUsersInPeriod,

            // Restaurants
            TotalRestaurants = agg.TotalRestaurants,
            ActiveRestaurants = agg.ActiveRestaurants,
            PendingRestaurants = agg.PendingRestaurants,

            // Delivery
            TotalDeliveries = agg.TotalDeliveries,
            ActiveAgents = agg.ActiveAgents,
            AvailableAgents = agg.AvailableAgents,

            // Reviews
            TotalReviews = agg.TotalReviews,
            AvgPlatformRating = (decimal)Math.Round(agg.AvgRating, 1),

            // Fulfillment
            FulfillmentRate = fulfillmentRate,

            // Charts
            OrdersChart = ordersChart,
            RevenueChart = revenueChart,
            TopRestaurants = topRestaurants
        };

        // ── Set cache before returning (FIX-04) ─────────
        await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5), ct);

        return result;
    }

    private async Task<DashboardAggregateRow> AggregateAllAsync(
        DateTime periodStart,
        DateTime periodEndParam,
        CancellationToken ct)
    {
        var todayStart = DateTime.UtcNow.Date;

        // Sequential queries: DbContext is not thread-safe (FIX-02 revised)
        var totalOrders = await _db.Orders.CountAsync(ct);
        var totalRevenue = await _db.Orders
            .Where(o => o.PaymentStatus == OrderPaymentStatus.Paid)
            .SumAsync(o => (decimal?)o.TotalAmount, ct) ?? 0;
        var completedOrders = await _db.Orders
            .Where(o => o.OrderStatus == OrderStatus.Completed || o.OrderStatus == OrderStatus.Delivered)
            .CountAsync(ct);
        var pendingOrders = await _db.Orders
            .Where(o => o.OrderStatus == OrderStatus.Placed
                     || o.OrderStatus == OrderStatus.Confirmed
                     || o.OrderStatus == OrderStatus.Preparing)
            .CountAsync(ct);
        var activeOrders = await _db.Orders
            .Where(o => o.OrderStatus == OrderStatus.ReadyForPickup
                     || o.OrderStatus == OrderStatus.OutForDelivery)
            .CountAsync(ct);
        var cancelledOrders = await _db.Orders
            .Where(o => o.OrderStatus == OrderStatus.Cancelled
                     || o.OrderStatus == OrderStatus.Refunded)
            .CountAsync(ct);

        var periodOrderCount = await _db.Orders
            .Where(o => o.CreatedAt >= periodStart && o.CreatedAt < periodEndParam)
            .CountAsync(ct);
        var periodRevenue = await _db.Orders
            .Where(o => o.CreatedAt >= periodStart && o.CreatedAt < periodEndParam
                     && o.PaymentStatus == OrderPaymentStatus.Paid)
            .SumAsync(o => (decimal?)o.TotalAmount, ct) ?? 0;
        var periodCompleted = await _db.Orders
            .Where(o => o.CreatedAt >= periodStart && o.CreatedAt < periodEndParam
                     && (o.OrderStatus == OrderStatus.Completed || o.OrderStatus == OrderStatus.Delivered))
            .CountAsync(ct);
        var periodCancelled = await _db.Orders
            .Where(o => o.CreatedAt >= periodStart && o.CreatedAt < periodEndParam
                     && (o.OrderStatus == OrderStatus.Cancelled
                      || o.OrderStatus == OrderStatus.Refunded))
            .CountAsync(ct);
        var periodPaid = await _db.Orders
            .Where(o => o.CreatedAt >= periodStart && o.CreatedAt < periodEndParam
                     && o.PaymentStatus == OrderPaymentStatus.Paid)
            .CountAsync(ct);

        var todayOrders = await _db.Orders
            .Where(o => o.CreatedAt >= todayStart)
            .CountAsync(ct);
        var todayRevenue = await _db.Orders
            .Where(o => o.CreatedAt >= todayStart && o.PaymentStatus == OrderPaymentStatus.Paid)
            .SumAsync(o => (decimal?)o.TotalAmount, ct) ?? 0;

        var totalUsers = await _db.Users
            .Where(u => u.DeletedAt == null)
            .CountAsync(ct);
        var totalCustomers = await _db.Customers
            .CountAsync(c => c.User.Role == UserRole.Customer, ct);
        var totalVendors = await _db.Vendors.CountAsync(ct);
        var totalAgents = await _db.DeliveryAgents.CountAsync(ct);
        var newUsersToday = await _db.Users
            .Where(u => u.CreatedAt >= todayStart && u.DeletedAt == null)
            .CountAsync(ct);
        var newUsersInPeriod = await _db.Users
            .Where(u => u.CreatedAt >= periodStart && u.CreatedAt < periodEndParam && u.DeletedAt == null)
            .CountAsync(ct);

        var totalRestaurants = await _db.Restaurants
            .Where(r => r.DeletedAt == null && r.Vendor.Status == VendorStatus.Approved)
            .CountAsync(ct);
        var activeRestaurants = await _db.Restaurants
            .Where(r => r.Status == RestaurantStatus.Active && r.DeletedAt == null && r.Vendor.Status == VendorStatus.Approved)
            .CountAsync(ct);
        var pendingRestaurants = await _db.Restaurants
            .Where(r => r.Status == RestaurantStatus.Pending && r.DeletedAt == null && r.Vendor.Status == VendorStatus.Approved)
            .CountAsync(ct);

        var totalDeliveries = await _db.DeliveryTasks
            .Where(t => t.Status == DeliveryTaskStatus.Delivered)
            .CountAsync(ct);
        var activeAgents = await _db.DeliveryAgents
            .Where(a => a.Status == AgentStatus.Active)
            .CountAsync(ct);
        var availableAgents = await _db.DeliveryAgents
            .Where(a => a.Status == AgentStatus.Active && a.IsAvailable)
            .CountAsync(ct);

        var totalReviews = await _db.Restaurants
            .Where(r => r.DeletedAt == null)
            .SumAsync(r => r.TotalRatings, ct);
        var avgRating = await _db.Restaurants
            .Where(r => r.DeletedAt == null && r.TotalRatings > 0)
            .AverageAsync(r => (double?)r.AvgRating, ct) ?? 0;

        return new DashboardAggregateRow
        {
            TotalOrders = totalOrders,
            TotalRevenue = totalRevenue,
            CompletedOrders = completedOrders,
            PendingOrders = pendingOrders,
            ActiveOrders = activeOrders,
            CancelledOrders = cancelledOrders,
            PeriodOrderCount = periodOrderCount,
            PeriodRevenue = periodRevenue,
            PeriodCompletedOrders = periodCompleted,
            PeriodCancelledOrders = periodCancelled,
            PeriodPaidOrders = periodPaid,
            TodayOrders = todayOrders,
            TodayRevenue = todayRevenue,
            TotalUsers = totalUsers,
            TotalCustomers = totalCustomers,
            TotalVendors = totalVendors,
            TotalAgents = totalAgents,
            NewUsersToday = newUsersToday,
            NewUsersInPeriod = newUsersInPeriod,
            TotalRestaurants = totalRestaurants,
            ActiveRestaurants = activeRestaurants,
            PendingRestaurants = pendingRestaurants,
            TotalDeliveries = totalDeliveries,
            ActiveAgents = activeAgents,
            AvailableAgents = availableAgents,
            TotalReviews = totalReviews,
            AvgRating = avgRating
        };
    }
}

internal sealed class DashboardAggregateRow
{
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public int CompletedOrders { get; set; }
    public int PendingOrders { get; set; }
    public int ActiveOrders { get; set; }
    public int CancelledOrders { get; set; }
    public int PeriodOrderCount { get; set; }
    public decimal PeriodRevenue { get; set; }
    public int PeriodCompletedOrders { get; set; }
    public int PeriodCancelledOrders { get; set; }
    public int PeriodPaidOrders { get; set; }
    public int TodayOrders { get; set; }
    public decimal TodayRevenue { get; set; }
    public int TotalUsers { get; set; }
    public int TotalCustomers { get; set; }
    public int TotalVendors { get; set; }
    public int TotalAgents { get; set; }
    public int NewUsersToday { get; set; }
    public int NewUsersInPeriod { get; set; }
    public int TotalRestaurants { get; set; }
    public int ActiveRestaurants { get; set; }
    public int PendingRestaurants { get; set; }
    public int TotalDeliveries { get; set; }
    public int ActiveAgents { get; set; }
    public int AvailableAgents { get; set; }
    public int TotalReviews { get; set; }
    public double AvgRating { get; set; }
}
