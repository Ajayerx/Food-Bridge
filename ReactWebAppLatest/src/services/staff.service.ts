import api from "../lib/apiClient";
import type { ApiResponse } from "../types";

export interface StaffApiRow {
    id: string;
    user_id: string;
    full_name: string;
    mobile_number: string;
    email: string | null;
    avatar_url: string | null;
    restaurant_id: string;
    restaurant_name: string;
    staff_role: string;
    is_active: boolean;
    created_at: string;
}

export const staffService = {
    getStaff: (restaurantId: string) =>
        api.get<ApiResponse<StaffApiRow[]>>(
            `/restaurants/${restaurantId}/staff`
        ),

    addStaff: (
        restaurantId: string,
        data: {
            mobileNumber: string;
            fullName?: string;
            email?: string;
            staffRole: string;
        }
    ) =>
        api.post<ApiResponse<StaffApiRow>>(
            `/restaurants/${restaurantId}/staff`,
            {
                mobile_number: data.mobileNumber,  // ← snake_case
                full_name: data.fullName,           // ← snake_case
                staff_role: data.staffRole,         // ← snake_case
                ...(data.email ? { email: data.email } : {}),
            }
        ),

    updateStaff: (
        restaurantId: string,
        staffId: string,
        data: {
            fullName?: string;
            email?: string;
            staffRole: string;
        }
    ) =>
        api.put<ApiResponse<StaffApiRow>>(
            `/restaurants/${restaurantId}/staff/${staffId}`,
            {
                full_name: data.fullName,           // ← snake_case
                staff_role: data.staffRole,         // ← snake_case
                ...(data.email ? { email: data.email } : {}),
            }
        ),
    removeStaff: (restaurantId: string, staffId: string) =>
        api.delete<ApiResponse<void>>(
            `/restaurants/${restaurantId}/staff/${staffId}`
        ),
};