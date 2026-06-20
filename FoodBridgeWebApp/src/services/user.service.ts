import api from "../lib/apiClient";
import type { ApiResponse, ApiUser, RoleType } from "../types";

// ── Request params ────────────────────────────────────────────────────────────
export interface GetUsersParams {
    page?: number;
    pageSize?: number;
    role?: RoleType;
    status?: string;
    search?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────
export const userService = {
    /**
     * GET /admin/users
     * Response: { success: true, data: { items: ApiUser[], total_count: number } }
     */
    getUsers: async (params?: GetUsersParams) => {
        const res = await api.get<ApiResponse<any>>("/admin/users", {
            params: {
                page: params?.page ?? 1,
                pageSize: params?.pageSize ?? 20,
                role: params?.role,
                status: params?.status,
                search: params?.search,
            },
        });
        const body = res.data.data ?? { items: [], total_count: 0 };
        return {
            ...res,
            data: {
                ...res.data,
                data: {
                    items: body.items ?? [],
                    totalCount: body.total_count ?? 0,
                },
            },
        };
    },

    /**
     * PATCH /admin/users/{id}/suspend
     * PATCH /admin/users/{id}/reactivate
     */
    setUserStatus: (userId: string, makeActive: boolean) => {
        const action = makeActive ? "reactivate" : "suspend";
        return api.patch<ApiResponse<{ message: string }>>(
            `/admin/users/${userId}/${action}`
        );
    },
};