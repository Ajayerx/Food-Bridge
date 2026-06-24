// DashboardStatsDto.cs
namespace FoodBridge.Application.DTOs.Admin;

public class DashboardStatsDto
{
    // ── Orders ────────────────────────────────────────────
    public int TotalOrders { get; set; }
    public int TodayOrders { get; set; }
    public int PendingOrders { get; set; }
    public int ActiveOrders { get; set; }
    public int CancelledOrders { get; set; }

    // ── Revenue ───────────────────────────────────────────
    public decimal TotalRevenue { get; set; }
    public decimal TodayRevenue { get; set; }
    public decimal PeriodRevenue { get; set; }
    public decimal PlatformCommission { get; set; }
    public decimal AverageOrderValue { get; set; }

    // ── Users ─────────────────────────────────────────────
    public int TotalUsers { get; set; }
    public int TotalCustomers { get; set; }
    public int TotalVendors { get; set; }
    public int TotalAgents { get; set; }
    public int NewUsersToday { get; set; }
    public int NewUsersThisMonth { get; set; }

    // ── Restaurants ───────────────────────────────────────
    public int TotalRestaurants { get; set; }
    public int ActiveRestaurants { get; set; }
    public int PendingRestaurants { get; set; }

    // ── Delivery ──────────────────────────────────────────
    public int TotalDeliveries { get; set; }
    public int ActiveAgents { get; set; }
    public int AvailableAgents { get; set; }

    // ── Reviews ───────────────────────────────────────────
    public int TotalReviews { get; set; }
    public decimal AvgPlatformRating { get; set; }

    // ── Fulfillment ───────────────────────────────────────
    public double FulfillmentRate { get; set; }

    // ── Charts ────────────────────────────────────────────
    public List<DashboardChartPointDto> OrdersChart { get; set; } = new();
    public List<DashboardChartPointDto> RevenueChart { get; set; } = new();
    public List<TopRestaurantDto> TopRestaurants { get; set; } = new();
}

public class DashboardChartPointDto
{
    public string Label { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public int Count { get; set; }
}

public class TopRestaurantDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AvgRating { get; set; }
}