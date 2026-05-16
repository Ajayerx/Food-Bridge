import api from "../lib/apiClient";
import type { ApiResponse } from "types";

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
