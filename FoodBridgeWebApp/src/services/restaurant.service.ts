import api from "../lib/apiClient";
import type {
    Restaurant,
    StaffMember,
    Table,
    ApiResponse,
} from "types";

const mapRestaurant = (r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? null,

    address: r.address_line,
    city: r.city,
    state: r.state,
    pinCode: r.pin_code,

    phone: r.phone_number ?? null,
    email: r.email ?? null,

    logoUrl: r.logo_url ?? null,

    deliveryFee: r.delivery_fee,
    minOrderAmount: r.min_order_amount,
    avgDeliveryMinutes: r.avg_delivery_minutes,

    status: r.status,
    isOpen: r.is_open === true || r.is_open === 1,

    avgRating: r.avg_rating ?? null,
    totalRatings: r.total_ratings,

    vendorName: r.vendor_name ?? null,
    vendorMobile: r.vendor_mobile ?? null,

    vendorEmail: r.vendor_email ?? null,
    fssaiLicense: r.fssai_license ?? null,

    createdAt: r.created_at,
});

export const restaurantService = {
    // ─── Vendor: own restaurant ──────────────────────────────────────────────────

    // GET /v1/restaurants/mine
    getMyRestaurants: () =>
        api.get<any>("/restaurants/mine"),

    getMyRestaurant: () =>
        api.get<ApiResponse<Restaurant>>("/restaurants/mine"),

    // PUT /v1/restaurants/{id}
    updateRestaurant: (id: string, data: Partial<Restaurant>) =>
        api.put<ApiResponse<Restaurant>>(`/restaurants/${id}`, data),

    // PATCH /v1/restaurants/{id}/toggle-active
    toggleActive: async (id: string) => {
        const res = await api.patch<any>(`/restaurants/${id}/toggle-active`);
        return {
            ...res,
            data: {
                ...res.data,
                data: { isOpen: res.data.data.is_open } // ✅ map to camelCase
            }
        };
    },

    // ─── Staff ───────────────────────────────────────────────────────────────────

    // GET /v1/restaurants/{restaurantId}/staff
    getStaff: (restaurantId: string) =>
        api.get<ApiResponse<StaffMember[]>>(
            `/restaurants/${restaurantId}/staff`
        ),

    // POST /v1/restaurants/{restaurantId}/staff
    addStaff: (
        restaurantId: string,
        data: { mobileNumber: string; role: string; name?: string; email?: string }
    ) =>
        api.post<ApiResponse<StaffMember>>(
            `/restaurants/${restaurantId}/staff`,
            {
                mobile_number: data.mobileNumber,
                full_name: data.name ?? null,
                email: data.email ?? null,
                staff_role: data.role,
            }
        ),

    // PUT /v1/restaurants/{restaurantId}/staff/{staffId}
    updateStaffStatus: (
        restaurantId: string,
        staffId: string,
        isActive: boolean
    ) =>
        api.put<ApiResponse<StaffMember>>(
            `/restaurants/${restaurantId}/staff/${staffId}`,
            { status: isActive ? "active" : "inactive" }
        ),

    // ─── Tables ──────────────────────────────────────────────────────────────────

    // GET /v1/restaurants/{id}/tables
    getTables: (restaurantId: string) =>
        api.get<ApiResponse<Table[]>>(
            `/restaurants/${restaurantId}/tables`
        ),

    // POST /v1/restaurants/{restaurantId}/tables
    createTable: (
        restaurantId: string,
        data: { tableNumber: string; capacity: number }
    ) =>
        api.post<ApiResponse<Table>>(
            `/restaurants/${restaurantId}/tables`,
            {
                table_name: data.tableNumber,
                capacity: data.capacity,
            }
        ),

    // PUT /v1/restaurants/{restaurantId}/tables/{tableId}
    updateTable: (
        restaurantId: string,
        tableId: string,
        data: { tableNumber?: string; capacity?: number; status?: string }
    ) =>
        api.put<ApiResponse<Table>>(
            `/restaurants/${restaurantId}/tables/${tableId}`,
            {
                table_name: data.tableNumber,
                capacity: data.capacity,
                status: data.status,
            }
        ),

    // PATCH /v1/restaurants/{restaurantId}/tables/{tableId}
    assignTable: (restaurantId: string, tableId: string) =>
        api.patch(
            `/restaurants/${restaurantId}/tables/${tableId}`,
            { status: "reserved" }
        ),

    // DELETE /v1/restaurants/{restaurantId}/tables/{tableId}
    deleteTable: (restaurantId: string, tableId: string) =>
        api.delete<ApiResponse<void>>(
            `/restaurants/${restaurantId}/tables/${tableId}`
        ),

    // ─── Admin ───────────────────────────────────────────────────────────────────

    // GET /v1/admin/restaurants
    getAllRestaurants: async (params?: {
        page?: number;
        pageSize?: number;
        status?: string;
        search?: string;
    }) => {
        const res = await api.get<ApiResponse<any>>(
            "/admin/restaurants",
            {
                params: {
                    page: params?.page ?? 1,
                    pageSize: params?.pageSize ?? 500,
                    status: params?.status,
                    search: params?.search,
                },
            }
        );

        const payload = res.data;
        const body: any = payload.data;

        const raw: any[] = Array.isArray(body)
            ? body
            : body?.items ?? [];
        const totalCount: number = body?.total_count ?? 0;

        return {
            ...res,
            data: {
                ...payload,
                data: {
                    items: raw.map((r: any) => ({
                        id: r.id,
                        name: r.name,
                        description: r.description ?? null,

                        address: r.address_line,
                        city: r.city,
                        state: r.state,
                        pinCode: r.pin_code,

                        phone: r.phone_number ?? null,
                        email: r.email ?? null,
                        fssaiLicense: r.fssai_license ?? null,

                        logoUrl: r.logo_url ?? null,

                        deliveryFee: r.delivery_fee,
                        minOrderAmount: r.min_order_amount,
                        avgDeliveryMinutes: r.avg_delivery_minutes,

                        status: r.status,
                        isOpen: r.is_open,

                        avgRating: r.avg_rating ?? null,
                        totalRatings: r.total_ratings,

                        vendorId: r.vendor_id,
                        vendorName: r.vendor_name ?? null,
                        vendorMobile: r.vendor_mobile ?? null,
                        vendorEmail: r.vendor_email ?? null,
                        isPureVeg: r.is_pure_veg ?? false,
                        cuisines: r.cuisines ?? [],
                        operatingHours: (r.operating_hours ?? []).map((h: any) => ({
                            day: h.day,
                            open: h.open,
                            close: h.close,
                            closed: h.closed,
                        })),
                        rejectionReason: r.rejection_reason ?? null,

                        createdAt: r.created_at,
                    })),
                    totalCount,
                },
            },
        };
    },
    // PATCH /v1/admin/restaurants/{id}/approve
    approveRestaurant: (id: string) =>
        api.patch<ApiResponse<{ message: string }>>(
            `/admin/restaurants/${id}/approve`
        ),

    // PATCH /v1/admin/restaurants/{id}/reject
    rejectRestaurant: (id: string, reason: string) =>
        api.patch<ApiResponse<{ message: string }>>(
            `/admin/restaurants/${id}/reject`,
            { reason }
        ),

    // PATCH /v1/admin/restaurants/{id}/suspend
    suspendRestaurant: (id: string, reason: string) =>
        api.patch<ApiResponse<{ message: string }>>(
            `/admin/restaurants/${id}/suspend`,
            { reason }
        ),
    // PATCH /v1/admin/restaurants/{id}/unsuspend
    unsuspendRestaurant: (id: string) =>
        api.patch<ApiResponse<{ message: string }>>(
            `/admin/restaurants/${id}/unsuspend`
        ),

    // ─── Vendor: restaurant management ────────────────────────────────────────────

    // POST /v1/restaurants
    createRestaurant: (data: Partial<Restaurant>) =>
        api.post<ApiResponse<Restaurant>>("/restaurants", data),

    // POST /v1/restaurants/{id}/submit
    submitForApproval: (id: string) =>
        api.post<ApiResponse<{ message: string }>>(`/restaurants/${id}/submit`),

    // POST /v1/restaurants/{id}/toggle-status
    toggleRestaurantStatus: (id: string) =>
        api.post<ApiResponse<{ message: string }>>(`/restaurants/${id}/toggle-status`),

    // ─── Delivery Agents ─────────────────────────────────────────────────────────

    // GET /v1/restaurants/{id}/delivery-agents
    getDeliveryAgents: (restaurantId: string) =>
        api.get<ApiResponse<any>>(`/restaurants/${restaurantId}/delivery-agents`),
};