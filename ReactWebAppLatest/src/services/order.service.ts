import api from "../lib/apiClient";
import type { Order, OrderStatus, ApiResponse } from "types";

const FE_TO_BE: Record<OrderStatus, string> = {
    placed: "Placed",
    accepted: "Confirmed",
    preparing: "Preparing",
    ready: "ReadyForPickup",
    out_for_delivery: "OutForDelivery",
    completed: "Completed",
    cancelled: "Cancelled",
};

const BE_TO_FE: Record<string, OrderStatus> = {
    placed: "placed",
    confirmed: "accepted",
    preparing: "preparing",
    readyforpickup: "ready",
    outfordelivery: "out_for_delivery",
    delivered: "completed",
    completed: "completed",
    cancelled: "cancelled",
};

const ORDER_TYPE_TO_BE: Record<string, string> = {
    dinein: "DineIn",
    takeaway: "Takeaway",
    delivery: "Delivery",
};

const PAYMENT_METHOD_TO_BE: Record<string, string> = {
    cod: "COD",
    online: "Online",
};

export function toBackendStatus(status: OrderStatus): string {
    return FE_TO_BE[status] ?? status;
}

export function toFrontendStatus(beStatus: string): OrderStatus {
    return (
        BE_TO_FE[beStatus.toLowerCase().replace(/_/g, "")] ??
        (beStatus.toLowerCase() as OrderStatus)
    );
}

export function normalizeOrder(raw: any): Order {
    return {
        id: raw.id,
        orderCode: raw.order_code ?? null,
        restaurantId: raw.restaurant_id,
        customerId: raw.customer_id ?? null,
        agentId: raw.delivery_agent_id ?? null,
        orderType: raw.order_type?.toLowerCase() ?? null,
        status: toFrontendStatus(raw.order_status ?? raw.status ?? "placed"),
        subtotalAmount: Number(raw.subtotal_amount ?? 0),
        taxAmount: Number(raw.tax_amount ?? 0),
        totalAmount: Number(raw.total_amount ?? 0),
        deliveryFee: Number(raw.delivery_fee ?? 0),
        discountAmount: Number(raw.discount_amount ?? 0),
        platformFee: Number(raw.platform_fee ?? 0),
        paymentMethod: raw.payment_method ?? "",
        paymentStatus: (raw.payment_status ?? "pending").toLowerCase(),
        deliveryAddress: raw.delivery_address_text ?? null,
        specialInstructions: raw.notes ?? null,
        couponCode: raw.coupon_code ?? null,
        items: (raw.items ?? []).map((i: any) => ({
            id: i.id,
            menuItemId: i.menu_item_id,
            name: i.item_name ?? null,
            variantName: i.variant_name ?? null,
            price: Number(i.unit_price ?? 0),
            quantity: Number(i.quantity),
            subtotal: Number(i.total_price ?? 0),
            notes: i.notes ?? null,
        })),
        createdAt: raw.created_at,
        updatedAt: raw.updated_at ?? raw.created_at,
        acceptedAt: raw.accepted_at ?? null,
        readyAt: raw.ready_at ?? null,
        completedAt: raw.delivered_at ?? null,
        cancelledAt: raw.cancelled_at ?? null,
        tableName: raw.table_name ?? null,
        tableCapacity: raw.table_capacity ? Number(raw.table_capacity) : null,
    };
}

export const orderService = {
    // GET /v1/orders
    getRestaurantOrders: (
        restaurantId: string,
        params?: { page?: number; limit?: number; status?: OrderStatus }
    ) =>
        api.get<ApiResponse<any>>(`/orders`, {
            params: {
                restaurantId,
                page: params?.page ?? 1,
                pageSize: params?.limit ?? 200,
                ...(params?.status ? { status: toBackendStatus(params.status) } : {}),
            },
        }),

    // GET /v1/orders/{id}
    getOrder: (orderId: string) =>
        api.get<ApiResponse<any>>(`/orders/${orderId}`),

    // PATCH /v1/orders/{id}/status
    updateStatus: (orderId: string, status: OrderStatus, reason?: string) =>
        api.patch<ApiResponse<any>>(`/orders/${orderId}/status`, {
            status: toBackendStatus(status),
            reason: reason ?? null,
        }),

    // POST /v1/orders/{id}/cancel
    cancelOrder: (orderId: string, reason?: string) =>
        api.post<ApiResponse<any>>(`/orders/${orderId}/cancel`, {
            reason: reason ?? null,
        }),

    // POST /v1/orders/{id}/assign-agent
    assignAgent: (orderId: string, agentId: string) =>
        api.post<ApiResponse<any>>(`/orders/${orderId}/assign-agent`, {
            agent_id: agentId,
        }),

    // GET /v1/cart/calculate
    calculateCart: (params: {
        restaurant_id: string;
        items: {
            menu_item_id: string;
            quantity: number;
            variant_id?: string;
            modifier_option_ids?: string[];
        }[];
        coupon_code?: string;
        delivery_address_id?: string;
        order_type?: string;
    }) =>
        api.get<ApiResponse<any>>(`/cart/calculate`, {
            params: {
                restaurant_id: params.restaurant_id,
                items: JSON.stringify(params.items),
                coupon_code: params.coupon_code ?? undefined,
                delivery_address_id: params.delivery_address_id ?? undefined,
                order_type: params.order_type
                    ? ORDER_TYPE_TO_BE[params.order_type] ?? params.order_type
                    : undefined,
            },
        }),

    // POST /v1/orders
    createOrder: (payload: {
        restaurant_id: string;
        order_type: "delivery" | "takeaway" | "dinein";
        delivery_address_id?: string;
        table_id?: string;
        items: {
            menu_item_id: string;
            variant_id?: string;
            quantity: number;
            modifiers?: { modifier_option_id: string }[];
            notes?: string;
        }[];
        coupon_code?: string;
        payment_method?: "cod" | "online";
        notes?: string;
    }) =>
        api.post<ApiResponse<any>>("/orders", {
            ...payload,
            order_type: ORDER_TYPE_TO_BE[payload.order_type] ?? payload.order_type,
            payment_method: payload.payment_method
                ? PAYMENT_METHOD_TO_BE[payload.payment_method] ?? payload.payment_method
                : undefined,
        }),
  
    // POST /v1/orders/{id}/items
    addItemsToOrder: (
        orderId: string,
        payload: {
            items: {
                menu_item_id: string;
                quantity: number;
                variant_id?: string;
            }[];
        }
    ) =>
        api.post<ApiResponse<any>>(`/orders/${orderId}/items`, payload),
    
    // POST /v1/orders/{id}/settle-bill
    settleBill: (orderId: string, paymentMethod: string) =>
        api.post<ApiResponse<any>>(
            `/orders/${orderId}/settle-bill?paymentMethod=${paymentMethod}`
        ),
};