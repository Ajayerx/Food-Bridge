import api from "../lib/apiClient";
import type { ApiResponse } from "types";

export const reportService = {
    // ── Vendor report ──────────────────────────────────────────────────────────
    getVendorReport: (
        restaurantId: string,
        params: { from: string; to: string }
    ) =>
        api
            .get<ApiResponse<any>>("/reports/vendor/sales", {
                params: {
                    restaurantId: restaurantId,
                    from: params.from,
                    to: params.to,
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
                                restaurantId: restaurantId,
                                from: params.from,
                                to: params.to,
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
                                restaurantId: restaurantId,
                                from: params.from,
                                to: params.to,
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
    getPlatformReport: (params: { from: string; to: string }) =>
        api
            .get<ApiResponse<any>>("/reports/admin/platform", {
                params: { from: params.from, to: params.to },
            })
            .then((res) => {
                const raw = res.data.data ?? {};
                const normalised = {
                    totalRevenue: Number(raw.total_gmv ?? 0),
                    totalOrders: Number(raw.total_orders ?? 0),
                    totalRestaurants: Number(raw.total_restaurants ?? 0),
                    totalUsers: Number(raw.total_users ?? 0),
                    newUsersToday: Number(raw.new_users ?? 0),
                    avgOrderValue: Number(raw.average_order_value ?? 0),
                    platformCommission: Number(raw.platform_revenue ?? 0),
                    revenueByDay: (raw.gmv_chart ?? []).map((d: any) => ({
                        date: d.label ?? "",
                        revenue: Number(d.revenue ?? 0),
                    })),
                    revenueByRestaurant: (raw.revenue_by_restaurant ?? []).map((r: any) => ({
                        restaurantId: "",
                        name: r.label ?? "",
                        revenue: Number(r.revenue ?? 0),
                    })),
                    payoutSummary: (raw.payout_summary ?? []).map((p: any) => ({
                        restaurantId: p.restaurant_id ?? "",
                        name: p.restaurant_name ?? "",
                        grossRevenue: Number(p.gross_revenue ?? 0),
                        platformFee: Number(p.platform_fee ?? 0),
                        netPayout: Number(p.net_payout ?? 0),
                    })),
                };
                return { data: { success: true, data: normalised } } as any;
            }),

    // ── Generic reports ─────────────────────────────────────────────────────────
    getSalesReport: (params: {
        restaurantId?: string;
        from?: string;
        to?: string;
        groupBy?: string;
    }) =>
        api.get<ApiResponse<any>>("/reports/sales", { params }),

    getOrderReport: (params: {
        restaurantId?: string;
        from?: string;
        to?: string;
        status?: string;
    }) =>
        api.get<ApiResponse<any>>("/reports/orders", { params }),

    getRevenueReport: (params: {
        restaurantId?: string;
        from?: string;
        to?: string;
        groupBy?: string;
    }) =>
        api.get<ApiResponse<any>>("/reports/revenue", { params }),

    // ── Vendor-scoped reports ───────────────────────────────────────────────────
    getVendorOrderReport: (restaurantId: string, params: { from: string; to: string }) =>
        api.get<ApiResponse<any>>("/reports/vendor/orders", {
            params: { restaurantId, ...params },
        }),

    getVendorDeliveryReport: (restaurantId: string, params: { from: string; to: string }) =>
        api.get<ApiResponse<any>>("/reports/vendor/delivery", {
            params: { restaurantId, ...params },
        }),

    // ── Admin-scoped reports ────────────────────────────────────────────────────
    getAdminVendorsReport: (params: {
        from?: string;
        to?: string;
        limit?: number;
    }) =>
        api
            .get<ApiResponse<any>>("/reports/admin/vendors", { params })
            .then((res) => {
                const raw = res.data.data ?? {};
                const normalised = {
                    fromDate: raw.from_date ?? "",
                    toDate: raw.to_date ?? "",
                    totalCount: Number(raw.total_count ?? 0),
                    vendors: (raw.vendors ?? []).map((v: any) => ({
                        vendorId: v.vendor_id ?? "",
                        vendorName: v.vendor_name ?? "",
                        totalOrders: Number(v.total_orders ?? 0),
                        totalRevenue: Number(v.total_revenue ?? 0),
                        commission: Number(v.commission ?? 0),
                        activeRestaurants: Number(v.active_restaurants ?? 0),
                        avgRating: Number(v.avg_rating ?? 0),
                    })),
                };
                return { data: { success: true, data: normalised } } as any;
            }),

    getAdminFinancialsReport: (params: {
        from?: string;
        to?: string;
        groupBy?: string;
    }) =>
        api
            .get<ApiResponse<any>>("/reports/admin/financials", { params })
            .then((res) => {
                const raw = res.data.data ?? {};
                const normalised = {
                    fromDate: raw.from_date ?? "",
                    toDate: raw.to_date ?? "",
                    totalGmv: Number(raw.total_gmv ?? 0),
                    totalCommission: Number(raw.total_commission ?? 0),
                    totalPayouts: Number(raw.total_payouts ?? 0),
                    netRevenue: Number(raw.net_revenue ?? 0),
                    totalRefunds: Number(raw.total_refunds ?? 0),
                    data: (raw.data ?? []).map((d: any) => ({
                        label: d.label ?? "",
                        gmv: Number(d.gmv ?? 0),
                        commission: Number(d.commission ?? 0),
                        payouts: Number(d.payouts ?? 0),
                        refunds: Number(d.refunds ?? 0),
                    })),
                };
                return { data: { success: true, data: normalised } } as any;
            }),
};
