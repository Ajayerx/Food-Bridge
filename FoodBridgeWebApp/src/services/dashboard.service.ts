import api from "../lib/apiClient";
import type { ApiResponse, DashboardStats } from "../types";

export const dashboardService = {
    /**
     * GET /admin/dashboard?from=...&to=...
     * Response: { success: true, data: DashboardStats }
     */
    getStats: (from?: string, to?: string) =>
        api.get<ApiResponse<DashboardStats>>("/admin/dashboard", {
            params: { from, to },
        }),
};