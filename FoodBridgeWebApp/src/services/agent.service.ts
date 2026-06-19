// agentService.ts
import api from "../lib/apiClient";
import type { ApiResponse } from "../types";

// ─── Response shape matching DeliveryAgentDto / DB schema ─────────────────────
export interface AgentApiRow {
    id: string;
    user_id: string;
    full_name: string;
    mobile_number: string;
    email: string | null;
    avatar_url: string | null;
    vehicle_type: string | null;
    vehicle_number: string | null;
    license_number: string | null;
    status: string;           // "Pending" | "Approved" | "Suspended"
    is_available: boolean;
    current_latitude: number | null;
    current_longitude: number | null;
    total_earnings: number;
    total_deliveries: number;
    created_at: string;
}

export const agentService = {
    /** GET v1/agents */
    getAgents: (params?: {
        status?: string;
        availableOnly?: boolean;
        page?: number;
        pageSize?: number;
    }) =>
        api.get<ApiResponse<AgentApiRow[]>>(`/agents`, { params }),

    /** POST v1/agents */
    addAgent: (data: {
        mobileNumber: string;
        fullName: string;
        email?: string;
        vehicleType?: string;
        vehicleNumber?: string;
        licenseNumber?: string;
    }) =>
        api.post<ApiResponse<AgentApiRow>>(`/agents`, {
            mobile_number: data.mobileNumber,
            full_name: data.fullName,
            ...(data.email ? { email: data.email } : {}),
            ...(data.vehicleType ? { vehicle_type: data.vehicleType } : {}),
            ...(data.vehicleNumber ? { vehicle_number: data.vehicleNumber } : {}),
            ...(data.licenseNumber ? { license_number: data.licenseNumber } : {}),
        }),

    /** PUT v1/agents/{id} */
    updateAgent: (
        agentId: string,
        data: {
            fullName?: string;
            email?: string;
            vehicleType?: string;
            vehicleNumber?: string;
            licenseNumber?: string;
        }
    ) =>
        api.put<ApiResponse<AgentApiRow>>(`/agents/${agentId}`, {
            ...(data.fullName ? { full_name: data.fullName } : {}),
            ...(data.email ? { email: data.email } : {}),
            ...(data.vehicleType ? { vehicle_type: data.vehicleType } : {}),
            ...(data.vehicleNumber ? { vehicle_number: data.vehicleNumber } : {}),
            ...(data.licenseNumber ? { license_number: data.licenseNumber } : {}),
        }),

    /** DELETE v1/agents/{id} */
    deleteAgent: (agentId: string) =>
        api.delete<ApiResponse<void>>(`/agents/${agentId}`),
};