import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard.service";
import type { DashboardStats, RawDashboardStats } from "../types";

const mapDashboard = (d: RawDashboardStats): DashboardStats => ({
    // Orders
    totalOrders: d.total_orders,
    todayOrders: d.today_orders,
    pendingOrders: d.pending_orders,
    activeOrders: d.active_orders,
    cancelledOrders: d.cancelled_orders,
    // Revenue
    totalRevenue: d.total_revenue,
    todayRevenue: d.today_revenue,
    periodRevenue: d.period_revenue,
    platformCommission: d.platform_commission,
    averageOrderValue: d.average_order_value,
    // Users
    totalUsers: d.total_users,
    totalCustomers: d.total_customers,
    totalVendors: d.total_vendors,
    totalAgents: d.total_agents,
    newUsersToday: d.new_users_today,
    newUsersThisMonth: d.new_users_this_month,
    // Restaurants
    totalRestaurants: d.total_restaurants,
    activeRestaurants: d.active_restaurants,
    pendingRestaurants: d.pending_restaurants,
    // Delivery
    totalDeliveries: d.total_deliveries,
    activeAgents: d.active_agents,
    availableAgents: d.available_agents,
    // Reviews
    totalReviews: d.total_reviews,
    avgPlatformRating: d.avg_platform_rating,
    // Fulfillment
    fulfillmentRate: d.fulfillment_rate,
    // Charts
    ordersChart: d.orders_chart ?? [],
    revenueChart: d.revenue_chart ?? [],
    topRestaurants: (d.top_restaurants ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        logoUrl: r.logo_url ?? null,
        totalOrders: r.total_orders,
        totalRevenue: r.total_revenue,
        avgRating: r.avg_rating,
    })),
});

export function useDashboard(from?: string, to?: string) {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-dashboard", from, to],
        queryFn: async () => {
            const res = await dashboardService.getStats(from, to);
            return mapDashboard(res.data.data);
        },
        staleTime: 60_000,
        retry: 1,
    });

    return { stats: data, isLoading, isError, refetch };
}