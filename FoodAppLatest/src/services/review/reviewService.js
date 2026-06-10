import api from "../api/base";

// ── Submit a review for a delivered order ─────────────────────────────────────
// CreateReviewRequestDto fields (snake_case_lower):
//   order_id      → passed as URL param (controller uses route {id})
//   restaurant_id → REQUIRED ❌ was missing
//   menu_item_id  → optional
//   rating        → required
//   comment       → optional
//   image_urls    → required (send empty array if none)
export async function submitReview(orderId, { rating, comment, restaurantId, menuItemId } = {}) {
    const res = await api.post(`/orders/${orderId}/review`, {
        restaurant_id: restaurantId,
        menu_item_id: menuItemId ?? null,
        rating,
        comment: comment || null,
        image_urls: [],
    });
    return res.data.data;
}

// ── Fetch customer's own review for an order ──────────────────────────────────
export async function getOrderReview(orderId) {
    try {
        const res = await api.get(`/orders/${orderId}/review`);
        return res.data.data;
    } catch (err) {
        // 404 means no review yet — return null instead of throwing
        if (err?.response?.status === 404) return null;
        throw err;
    }
}

// ── Fetch all public reviews for a restaurant ─────────────────────────────────
export async function getRestaurantReviews(restaurantId, page = 1, pageSize = 20) {
    const res = await api.get(`/restaurants/${restaurantId}/reviews`, {
        params: { page, page_size: pageSize },
    });
    return res.data.data;
}