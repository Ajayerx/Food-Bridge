import api from "../lib/apiClient";
import type { ApiResponse, Banner, CreateBannerRequest, UpdateBannerRequest, Commission, UpdateCommissionRequest, Payout } from "types";

// ── Normalise a raw DB user row (snake_case) → frontend User shape ────────────
export function normalizeUser(u: any) {
    return {
        id: u.id,
        name: u.name ?? null,
        mobileNumber: u.mobile_number,
        email: u.email ?? null,
        roleType: u.role_type,
        isActive: u.status === "Active",
        createdAt: u.created_at,
        updatedAt: u.updated_at ?? u.created_at,
    };
}

export const adminService = {
    // ── Users ───────────────────────────────────────────────────────────────────
    // Backend: GET /admin/users?role_type=&status=&page=&limit=
    // Response: { success, data: User[], meta: { page, limit, total } }
    getUsers: (params?: {
        page?: number;
        limit?: number;
        role?: string;
        search?: string;
    }) =>
        api.get<ApiResponse<any[]>>("/admin/users", {
            params: {
                page: params?.page,
                limit: params?.limit,
                // backend param is role_type, not role
                role_type: params?.role && params.role !== "all" ? params.role : undefined,
            },
        }),

    // Backend: POST /api/admin/users/{id}/ban
    banUser: (userId: string) =>
        api.post<ApiResponse<{ message: string }>>(`/admin/users/${userId}/ban`),

    // Backend: PATCH /admin/users/:id/suspend  OR  PATCH /admin/users/:id/reactivate
    updateUserStatus: (userId: string, isActive: boolean) => {
        const action = isActive ? "reactivate" : "suspend";
        return api.patch<ApiResponse<{ message: string }>>(
            `/admin/users/${userId}/${action}`
        );
    },

    // ── Settings ─────────────────────────────────────────────────────────────────
    // Backend: GET /admin/settings
    // Response: { success, data: Array<{ key, value, description }> }
    getSettings: () =>
        api.get<ApiResponse<Array<{ key: string; value: string; description: string }>>>(
            "/admin/settings"
        ),

    // Backend: PUT /admin/settings  body: { [key]: value }
    updateSettings: (data: Record<string, any>) =>
        api.put<ApiResponse<{ message: string }>>("/admin/settings", data),

    // ── Banners ──────────────────────────────────────────────────────────────────
    // Backend: GET /api/admin/banners
    getBanners: () =>
        api.get<ApiResponse<Banner[]>>("/admin/banners"),

    // Backend: POST /api/admin/banners
    createBanner: (data: CreateBannerRequest) =>
        api.post<ApiResponse<Banner>>("/admin/banners", data),

    // Backend: PUT /api/admin/banners/{id}
    updateBanner: (id: string, data: UpdateBannerRequest) =>
        api.put<ApiResponse<Banner>>(`/admin/banners/${id}`, data),

    // Backend: DELETE /api/admin/banners/{id}
    deleteBanner: (id: string) =>
        api.delete<ApiResponse<{ message: string }>>(`/admin/banners/${id}`),

    // ── Commissions ──────────────────────────────────────────────────────────────
    // Backend: GET /api/admin/commissions
    getCommissions: (params?: { page?: number; limit?: number }) =>
        api.get<ApiResponse<Commission[]>>("/admin/commissions", { params }),

    // Backend: PUT /api/admin/commissions/{id}
    updateCommission: (id: string, data: UpdateCommissionRequest) =>
        api.put<ApiResponse<Commission>>(`/admin/commissions/${id}`, data),

    // ── Payouts ──────────────────────────────────────────────────────────────────
    // Backend: GET /api/admin/payouts
    getPayouts: (params?: { page?: number; limit?: number; status?: string }) =>
        api.get<ApiResponse<Payout[]>>("/admin/payouts", { params }),

    // Backend: PUT /api/admin/payouts/{id}/processed
    markPayoutProcessed: (id: string) =>
        api.put<ApiResponse<{ message: string }>>(`/admin/payouts/${id}/processed`),

    // ── Dashboard ─────────────────────────────────────────────────────────────────
    // Backend: GET /admin/dashboard
    getDashboardStats: () =>
        api.get<
            ApiResponse<{
                totalRestaurants: number;
                activeRestaurants: number;
                totalOrders: number;
                totalUsers: number;
                todayRevenue: number;
                pendingApprovals: number;
            }>
        >("/admin/dashboard"),
};
