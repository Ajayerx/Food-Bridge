import api from "../lib/apiClient";
import type { ApiResponse } from "types";

// Schema: CreateCouponRequestDto
// { code, description?, coupon_type?, discount_value, min_order_amount,
//   max_discount_amount?, usage_limit?, per_user_limit?,
//   restaurant_id?, expires_at? }
//
// NOTE: The schema uses coupon_type (not discount_type), min_order_amount (not min_order_value),
//       max_discount_amount (not max_discount), and expires_at (not valid_until/valid_from).

export function normalizeCoupon(c: any) {
    return {
        id: c.id,
        restaurantId: c.restaurant_id ?? null,
        code: c.code,
        discountType: c.coupon_type ?? c.discount_type,
        discountValue: Number(c.discount_value),
        minOrderAmount: c.min_order_amount ? Number(c.min_order_amount) : null,
        maxDiscountAmount: c.max_discount_amount ? Number(c.max_discount_amount) : null,
        usageLimit: c.usage_limit ?? null,
        usedCount: Number(c.usage_count ?? 0),
        isActive: c.status === "active" || c.is_active === true,
        expiresAt: c.expires_at ?? null,
        createdAt: c.created_at,
    };
}

export const couponService = {
    // GET /v1/coupons
    getRestaurantCoupons: (_restaurantId: string) =>
        api.get<ApiResponse<any[]>>("/coupons"),

    // POST /v1/coupons  →  CreateCouponRequestDto
    createCoupon: (data: any) =>
        api.post<ApiResponse<any>>("/coupons", {
            code: (data.code as string)?.toUpperCase(),
            description: data.description ?? null,
            coupon_type: data.discountType,           // "percentage" | "flat"
            discount_value: data.discountValue,
            min_order_amount: data.minOrderAmount ?? 0,
            max_discount_amount: data.maxDiscountAmount ?? null,
            usage_limit: data.usageLimit ?? null,
            per_user_limit: data.perUserLimit ?? null,
            restaurant_id: data.restaurantId ?? null,
            expires_at: data.endDate
                ? new Date(data.endDate).toISOString()
                : null,
        }),

    // PUT /v1/coupons/{id}
    toggleCoupon: (couponId: string, isActive: boolean) =>
        api.put<ApiResponse<any>>(`/coupons/${couponId}`, {
            status: isActive ? "active" : "paused",
        }),

    // DELETE /v1/coupons/{id}
    deleteCoupon: (couponId: string) =>
        api.delete<ApiResponse<any>>(`/coupons/${couponId}`),

    // POST /v1/coupons/validate
    validateCoupon: (data: { code: string; restaurant_id: string; order_amount: number }) =>
        api.post<ApiResponse<any>>("/coupons/validate", data),
};