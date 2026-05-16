import api from "../lib/apiClient";
import type { ApiResponse, ApiUser, RoleType } from "../types";

// ── Request params ────────────────────────────────────────────────────────────
export interface GetUsersParams {
    page?: number;
    limit?: number;
    role?: RoleType;
    status?: string;
    search?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────
export const userService = {
    /**
     * GET /admin/users
     * Response: { success: true, data: ApiUser[] }  ← flat array, no meta
     */
    getUsers: (params?: GetUsersParams) =>
        api.get<ApiResponse<ApiUser[]>>("/admin/users", { params }),

    /**
     * PATCH /admin/users/:id/suspend
     * PATCH /admin/users/:id/reactivate
     */
    setUserStatus: (userId: string, makeActive: boolean) => {
        const action = makeActive ? "reactivate" : "suspend";
        return api.patch<ApiResponse<{ message: string }>>(
            `/admin/users/${userId}/${action}`
        );
    },
};