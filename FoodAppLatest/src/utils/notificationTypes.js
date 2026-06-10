// ─────────────────────────────────────────────────────────────────────────────
// Notification type resolver + type config — shared across all notification UI
// ─────────────────────────────────────────────────────────────────────────────

// ── Numeric enum → string key mapper (.NET backend sends int enums) ────────
const NUMERIC_TO_KEY = {
    0: "SYSTEM", 1: "PROMO_OFFER", 2: "SYSTEM",
    3: "ORDER_CONFIRMED", 4: "ORDER_PREPARING", 5: "ORDER_READY",
    6: "OUT_FOR_DELIVERY", 7: "ORDER_DELIVERED", 8: "ORDER_CANCELLED",
    9: "ORDER_CANCELLED_BY_VENDOR", 10: "REFUND_INITIATED",
    11: "REFUND_COMPLETED", 12: "PAYMENT_RECEIVED", 13: "REVIEW_REQUEST",
    14: "NEW_ORDER", 15: "NEW_REVIEW", 16: "ORDER_CONFIRMED",
};

const STRING_TO_KEY = {
    System: "SYSTEM", Promotion: "PROMO_OFFER", Support: "SYSTEM",
    OrderConfirmed: "ORDER_CONFIRMED", OrderPreparing: "ORDER_PREPARING",
    OrderReady: "ORDER_READY", OutForDelivery: "OUT_FOR_DELIVERY",
    OrderDelivered: "ORDER_DELIVERED", OrderCancelled: "ORDER_CANCELLED",
    OrderCancelledByVendor: "ORDER_CANCELLED_BY_VENDOR",
    RefundInitiated: "REFUND_INITIATED", RefundCompleted: "REFUND_COMPLETED",
    PaymentReceived: "PAYMENT_RECEIVED", ReviewRequest: "REVIEW_REQUEST",
    NewOrder: "NEW_ORDER", NewReview: "NEW_REVIEW", OrderUpdate: "ORDER_CONFIRMED",
    // Already-correct SCREAMING_SNAKE_CASE keys (idempotent)
    ORDER_CONFIRMED: "ORDER_CONFIRMED", ORDER_PREPARING: "ORDER_PREPARING",
    ORDER_READY: "ORDER_READY", OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    ORDER_DELIVERED: "ORDER_DELIVERED", ORDER_CANCELLED: "ORDER_CANCELLED",
    ORDER_CANCELLED_BY_VENDOR: "ORDER_CANCELLED_BY_VENDOR",
    REFUND_INITIATED: "REFUND_INITIATED", REFUND_COMPLETED: "REFUND_COMPLETED",
    PAYMENT_RECEIVED: "PAYMENT_RECEIVED", REVIEW_REQUEST: "REVIEW_REQUEST",
    NEW_ORDER: "NEW_ORDER", NEW_REVIEW: "NEW_REVIEW",
    PROMO_OFFER: "PROMO_OFFER", SYSTEM: "SYSTEM",
};

/**
 * Resolve any notification type (number, PascalCase, or SCREAMING_SNAKE_CASE)
 * into a consistent SCREAMING_SNAKE_CASE key that matches TYPE_CONFIG.
 *
 * @param {number|string|null|undefined} type — raw type from API / socket / push
 * @returns {string} — e.g. "ORDER_PREPARING", "SYSTEM"
 */
export function resolveTypeKey(type) {
    if (type === null || type === undefined) return "SYSTEM";
    if (typeof type === "number") return NUMERIC_TO_KEY[type] ?? "SYSTEM";
    return STRING_TO_KEY[String(type)] ?? "SYSTEM";
}

// ── Type config — icon, accent colour, background, label for each type ─────
export const TYPE_CONFIG = {
    ORDER_CONFIRMED: { icon: "✅", accent: "#22c55e", bg: "#f0fdf4", label: "Confirmed" },
    ORDER_PREPARING: { icon: "👨‍🍳", accent: "#f97316", bg: "#fff7ed", label: "Preparing" },
    ORDER_READY: { icon: "🎁", accent: "#8b5cf6", bg: "#f5f3ff", label: "Ready" },
    OUT_FOR_DELIVERY: { icon: "🛵", accent: "#3b82f6", bg: "#eff6ff", label: "On the way" },
    ORDER_DELIVERED: { icon: "🎉", accent: "#22c55e", bg: "#f0fdf4", label: "Delivered" },
    ORDER_CANCELLED: { icon: "❌", accent: "#ef4444", bg: "#fef2f2", label: "Cancelled" },
    ORDER_CANCELLED_BY_VENDOR: { icon: "😔", accent: "#ef4444", bg: "#fef2f2", label: "Cancelled" },
    REFUND_INITIATED: { icon: "🔄", accent: "#6366f1", bg: "#eef2ff", label: "Refund" },
    REFUND_COMPLETED: { icon: "💸", accent: "#22c55e", bg: "#f0fdf4", label: "Refund Done" },
    PAYMENT_RECEIVED: { icon: "💰", accent: "#22c55e", bg: "#f0fdf4", label: "Payment" },
    REVIEW_REQUEST: { icon: "✍️", accent: "#eab308", bg: "#fefce8", label: "Rate us" },
    NEW_ORDER: { icon: "🛎️", accent: "#f97316", bg: "#fff7ed", label: "New Order" },
    NEW_REVIEW: { icon: "⭐", accent: "#eab308", bg: "#fefce8", label: "Review" },
    PROMO_OFFER: { icon: "🎟️", accent: "#ec4899", bg: "#fdf2f8", label: "Promo" },
    SYSTEM: { icon: "🔔", accent: "#f97316", bg: "#fff7ed", label: "Notification" },
};

export const DEFAULT_CONFIG = { icon: "🔔", accent: "#f97316", bg: "#fff7ed", label: "Notification" };
