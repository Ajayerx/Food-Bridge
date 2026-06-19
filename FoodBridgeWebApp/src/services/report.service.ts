import api from "../lib/apiClient";
import type { ApiResponse } from "types";

export const reportService = {
    // ── Vendor report ──────────────────────────────────────────────────────────
    // Merges: GET /reports/vendor/sales  +  GET /reports/vendor/items
    // Optional: GET /reports/vendor/daily (if your backend adds it later)
    getVendorReport: (
        restaurantId: string,
        params: { from: string; to: string }
    ) =>
        api
            .get<ApiResponse<any>>("/reports/vendor/sales", {
                params: {
                    restaurantId: restaurantId,  // ✅ was restaurant_id
                    from: params.from,           // ✅ was from_date
                    to: params.to,               // ✅ was to_date
                },
            })
            .then(async (salesRes) => {
                const sales = salesRes.data.data ?? {};

                let topItems: any[] = [];
                try {
                    const itemsRes = await api.get<ApiResponse<any[]>>(
                        "/reports/vendor/items",
                        {
                            params: {
                                restaurantId: restaurantId,  // ✅ was restaurant_id
                                from: params.from,           // ✅ was from_date
                                to: params.to,               // ✅ was to_date
                                limit: 5,
                            },
                        }
                    );
                    topItems = (itemsRes.data.data ?? []).map((i: any) => ({
                        menuItemId: i.menu_item_id ?? i.id ?? "",
                        name: i.name,
                        totalOrders: Number(i.total_sold ?? 0),
                        revenue: Number(i.revenue ?? 0),
                    }));
                } catch {
                    // non-fatal
                }

                let revenueByDay: { date: string; revenue: number }[] = [];
                try {
                    const dailyRes = await api.get<ApiResponse<any[]>>(
                        "/reports/vendor/daily",
                        {
                            params: {
                                restaurantId: restaurantId,  // ✅ was restaurant_id
                                from: params.from,           // ✅ was from_date
                                to: params.to,               // ✅ was to_date
                            },
                        }
                    );
                    revenueByDay = (dailyRes.data.data ?? []).map((d: any) => ({
                        date: d.date ?? d.day ?? "",
                        revenue: Number(d.revenue ?? d.total_revenue ?? 0),
                    }));
                } catch {
                    // non-fatal
                }

                const normalised = {
                    totalOrders: Number(sales.total_orders ?? 0),
                    totalRevenue: Number(sales.total_revenue ?? 0),
                    avgOrderValue: Number(sales.avg_order_value ?? 0),
                    revenueByDay,
                    topItems,
                };

                return { data: { success: true, data: normalised } } as any;
            }),

    // ── Admin / platform report ────────────────────────────────────────────────
    // Backend: GET /reports/admin/platform?from_date=&to_date=
    getPlatformReport: (params: { from: string; to: string }) =>
        api
            .get<ApiResponse<any>>("/reports/admin/platform", {
                params: { from_date: params.from, to_date: params.to },
            })
            .then((res) => {
                const raw = res.data.data ?? {};
                const normalised = {
                    totalRevenue: Number(raw.gmv ?? 0),
                    totalOrders: Number(raw.total_orders ?? 0),
                    totalRestaurants: 0,
                    totalUsers: 0,
                    newUsersToday: 0,
                    revenueByDay: [] as { date: string; revenue: number }[],
                    revenueByRestaurant: [] as any[],
                    payoutSummary: [] as any[],
                };
                return { data: { success: true, data: normalised } } as any;
            }),
};