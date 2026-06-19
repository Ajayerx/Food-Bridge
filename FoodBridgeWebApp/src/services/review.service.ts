import api from "../lib/apiClient";
import type { ApiResponse } from "types";

// Schema: ReplyReviewRequestDto  { reply }   ← field is "reply" not "reply_text"
// Schema: CreateReviewRequestDto { order_id, restaurant_id, menu_item_id?, rating, comment?, image_urls? }

export const reviewService = {
    // GET /v1/restaurants/{id}/reviews
    getRestaurantReviews: (restaurantId: string) =>
        api.get(`/restaurants/${restaurantId}/reviews`),

    // POST /v1/reviews/{id}/reply  →  ReplyReviewRequestDto
    // Schema field is "reply" not "reply_text"
    replyToReview: (reviewId: string, reply: string) =>
        api.post(`/reviews/${reviewId}/reply`, { reply }),

    // GET /v1/reviews
    getAllReviews: (params?: { page?: number; limit?: number }) =>
        api.get<ApiResponse<any[]>>("/reviews", { params }),

    // DELETE /v1/reviews/{id}
    deleteReview: (reviewId: string) =>
        api.delete<ApiResponse<void>>(`/reviews/${reviewId}`),

    // PATCH /v1/admin/reviews/{id}/hide
    hideReview: (reviewId: string) =>
        api.patch<ApiResponse<void>>(`/admin/reviews/${reviewId}/hide`),
};