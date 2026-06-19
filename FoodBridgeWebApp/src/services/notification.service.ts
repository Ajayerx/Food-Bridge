import api from "../lib/apiClient";
import type { ApiResponse } from "types";

// ── Normalise raw DB notification row → frontend Notification shape ───────────
export function normalizeNotification(n: any) {
    return {
        id: n.id,
        userId: n.user_id,
        title: n.title,
        body: n.body,
        type: n.type,
        channel: n.channel ?? "in_app",
        isRead: n.is_read === 1 || n.is_read === true,
        data: n.data ? (typeof n.data === "string" ? JSON.parse(n.data) : n.data) : null,
        createdAt: n.created_at,
    };
}

export const notificationService = {
    // Backend: GET /notifications?page=&limit=&unread_only=
    getNotifications: (params?: {
        page?: number;
        limit?: number;
        unreadOnly?: boolean;
    }) =>
        api.get<ApiResponse<any[]>>("/notifications", {
            params: {
                page: params?.page,
                limit: params?.limit,
                unread_only: params?.unreadOnly ? 1 : undefined,
            },
        }),

    // Backend: PATCH /notifications/:id/read
    markRead: (notificationId: string) =>
        api.patch<ApiResponse<any>>(`/notifications/${notificationId}/read`),

    // Backend: PATCH /notifications/mark-all-read
    markAllRead: () =>
        api.patch<ApiResponse<void>>("/notifications/mark-all-read"),
};
