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
                    totalRestaurants: Number(raw.total_restaurants ?? 0),
                    totalUsers: Number(raw.total_users ?? 0),
                    newUsersToday: Number(raw.new_users_today ?? 0),
                    revenueByDay: (raw.revenue_by_day ?? []).map((d: any) => ({
                        date: d.date ?? "",
                        revenue: Number(d.revenue ?? 0),
                    })),
                    revenueByRestaurant: (raw.revenue_by_restaurant ?? []).map((r: any) => ({
                        restaurantId: r.restaurant_id ?? "",
                        name: r.name ?? "",
                        revenue: Number(r.revenue ?? 0),
                    })),
                    payoutSummary: (raw.payout_summary ?? []).map((p: any) => ({
                        restaurantId: p.restaurant_id ?? "",
                        name: p.name ?? "",
                        grossRevenue: Number(p.gross_revenue ?? 0),
                        platformFee: Number(p.platform_fee ?? 0),
                        netPayout: Number(p.net_payout ?? 0),
                    })),
                };
                return { data: { success: true, data: normalised } } as any;
            }),

    // ── Generic reports ─────────────────────────────────────────────────────────
    // Backend: GET /reports/sales?restaurantId=&from=&to=&groupBy=
    getSalesReport: (params: {
        restaurantId?: string;
        from?: string;
        to?: string;
        groupBy?: string;
    }) =>
        api.get<ApiResponse<any>>("/reports/sales", { params }),

    // Backend: GET /reports/orders?restaurantId=&from=&to=&status=
    getOrderReport: (params: {
        restaurantId?: string;
        from?: string;
        to?: string;
        status?: string;
    }) =>
        api.get<ApiResponse<any>>("/reports/orders", { params }),

    // Backend: GET /reports/revenue?restaurantId=&from=&to=&groupBy=
    getRevenueReport: (params: {
        restaurantId?: string;
        from?: string;
        to?: string;
        groupBy?: string;
    }) =>
        api.get<ApiResponse<any>>("/reports/revenue", { params }),

    // ── Vendor-scoped reports ───────────────────────────────────────────────────
    // Backend: GET /reports/vendor/orders?restaurantId=&from=&to=
    getVendorOrderReport: (restaurantId: string, params: { from: string; to: string }) =>
        api.get<ApiResponse<any>>("/reports/vendor/orders", {
            params: { restaurantId, ...params },
        }),

    // Backend: GET /reports/vendor/delivery?restaurantId=&from=&to=
    getVendorDeliveryReport: (restaurantId: string, params: { from: string; to: string }) =>
        api.get<ApiResponse<any>>("/reports/vendor/delivery", {
            params: { restaurantId, ...params },
        }),

    // ── Admin-scoped reports ────────────────────────────────────────────────────
    // Backend: GET /reports/admin/vendors?from=&to=&limit=
    getAdminVendorsReport: (params: { from?: string; to?: string; limit?: number }) =>
        api.get<ApiResponse<any>>("/reports/admin/vendors", { params }),

    // Backend: GET /reports/admin/financials?from=&to=&groupBy=
    getAdminFinancialsReport: (params: { from?: string; to?: string; groupBy?: string }) =>
        api.get<ApiResponse<any>>("/reports/admin/financials", { params }),
};