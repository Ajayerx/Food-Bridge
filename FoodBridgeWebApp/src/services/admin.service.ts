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

    // Backend: POST /admin/users/{id}/suspend
    suspendUser: (userId: string) =>
        api.post<ApiResponse<{ message: string }>>(`/admin/users/${userId}/suspend`),

    // Backend: POST /admin/users/{id}/reactivate
    reactivateUser: (userId: string) =>
        api.post<ApiResponse<{ message: string }>>(`/admin/users/${userId}/reactivate`),

    // ── Settings ─────────────────────────────────────────────────────────────────
    // Backend: GET /admin/settings
    // Response: { success, data: Array<{ key, value, description }> }
    getSettings: () =>
        api.get<ApiResponse<Array<{ key: string; value: string; description: string }>>>(
            "/admin/settings"
        ),

    // Backend: PUT /api/admin/settings/{key}
    updateSetting: (key: string, value: any) =>
        api.put<ApiResponse<{ message: string }>>(`/admin/settings/${key}`, { value }),

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
};
