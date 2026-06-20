import api from "../lib/apiClient";
import type { ApiResponse } from "types";

export interface AdminVendorRestaurantHours {
    day: string;
    open: string;
    close: string;
    closed: boolean;
}

export interface AdminVendorRestaurant {
    name: string;
    description: string | null;
    cuisines: string[];
    operatingHours: AdminVendorRestaurantHours[];
    addressLine: string;
    city: string;
    state: string;
    pinCode: string;
    phoneNumber: string | null;
    fssaiLicense: string | null;
    status: string;
    rejectionReason: string | null;
    deliveryFee: number;
    minOrderAmount: number;
    avgPrepMinutes: number;
    isPureVeg: boolean;
    isDineInEnabled: boolean;
    isTakeawayEnabled: boolean;
    isDeliveryEnabled: boolean;
}

export interface AdminVendor {
    id: string;
    businessName: string;
    status: VendorStatus;
    approvedAt: string | null;

    userName: string | null;
    mobileNumber: string;
    email: string | null;

    restaurantCount: number;
    restaurantNames: string | null;
    vendorRestaurants: AdminVendorRestaurant[];

    gstNumber: string | null;
    panNumber: string | null;
    bankAccountNumber: string | null;
    bankIfscCode: string | null;
    bankHolderName: string | null;

    createdAt: string;
}

export type VendorStatus = "Pending" | "Approved" | "Rejected" | "Suspended";

export interface GetVendorsParams {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
}

export interface VendorListData {
    items: AdminVendor[];
    totalCount: number;
}

const mapHours = (h: any): AdminVendorRestaurantHours => ({
    day: h.day ?? "",
    open: h.open ?? "",
    close: h.close ?? "",
    closed: h.closed ?? false,
});

const mapRestaurant = (r: any): AdminVendorRestaurant => ({
    name: r.name ?? "",
    description: r.description ?? null,
    cuisines: r.cuisines ?? [],
    operatingHours: (r.operating_hours ?? []).map(mapHours),
    addressLine: r.address_line ?? "",
    city: r.city ?? "",
    state: r.state ?? "",
    pinCode: r.pin_code ?? "",
    phoneNumber: r.phone_number ?? null,
    fssaiLicense: r.fssai_license ?? null,
    status: r.status ?? "",
    rejectionReason: r.rejection_reason ?? null,
    deliveryFee: r.delivery_fee ?? 0,
    minOrderAmount: r.min_order_amount ?? 0,
    avgPrepMinutes: r.avg_prep_minutes ?? 0,
    isPureVeg: r.is_pure_veg ?? false,
    isDineInEnabled: r.is_dine_in_enabled ?? false,
    isTakeawayEnabled: r.is_takeaway_enabled ?? false,
    isDeliveryEnabled: r.is_delivery_enabled ?? false,
});

const mapVendor = (r: any): AdminVendor => ({
    id: r.id,
    businessName: r.business_name ?? "",
    status: r.status,
    approvedAt: r.approved_at ?? null,
    userName: r.user_name ?? null,
    mobileNumber: r.mobile_number ?? "",
    email: r.email ?? null,
    restaurantCount: r.restaurant_count ?? 0,
    restaurantNames: r.restaurant_names ?? null,
    vendorRestaurants: (r.vendor_restaurants ?? []).map(mapRestaurant),
    gstNumber: r.gst_number ?? null,
    panNumber: r.pan_number ?? null,
    bankAccountNumber: r.bank_account_number ?? null,
    bankIfscCode: r.bank_ifsc_code ?? null,
    bankHolderName: r.bank_holder_name ?? null,
    createdAt: r.created_at,
});

export const vendorService = {
    getVendors: async (params?: GetVendorsParams) => {
        const res = await api.get<ApiResponse<any>>("/admin/vendors", {
            params: {
                page: params?.page ?? 1,
                pageSize: params?.pageSize ?? 500,
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
                    items: (body.items ?? []).map(mapVendor),
                    totalCount: body.total_count ?? 0,
                } as VendorListData,
            },
        };
    },

    approveVendor: (id: string) =>
        api.post<ApiResponse<{ message: string }>>(`/admin/vendors/${id}/approve`),

    rejectVendor: (id: string, reason: string) =>
        api.post<ApiResponse<{ message: string }>>(`/admin/vendors/${id}/reject`, { reason }),

    registerVendor: (data: any) =>
        api.post<ApiResponse<any>>("/vendor/register", data),
};
