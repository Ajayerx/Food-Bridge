import api from "../lib/apiClient";
import type { ApiResponse, DashboardStats } from "../types";

export const dashboardService = {
    /**
     * GET /admin/dashboard
     * Response: { success: true, data: DashboardStats }
     * C# serialises PascalCase → camelCase via JSON options
     */
    getStats: () =>
        api.get<ApiResponse<DashboardStats>>("/admin/dashboard"),
};