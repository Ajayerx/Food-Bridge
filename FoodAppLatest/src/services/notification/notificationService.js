// src/services/notification/notificationService.js
// FoodApp (React Native / Expo customer app)
import api from "../api/base";
import { useNotificationStore } from "../../store/notificationStore";

// ── Normalise raw DB row → frontend shape ──────────────────────────────────
export function normalizeNotification(n) {
    // Support both API (snake_case) and socket (camelCase) payloads
    const rawId = n.id ?? n.Id;
    const rawUserId = n.user_id ?? n.userId ?? n.UserId;
    const rawIsRead = n.is_read ?? n.isRead ?? false;
    const rawCreatedAt = n.created_at ?? n.createdAt;
    const rawData = n.data ?? n.Data;

    var parsedData = null;
    if (rawData) {
        if (typeof rawData === "string") {
            try { parsedData = JSON.parse(rawData); } catch (e) { parsedData = null; }
        } else {
            parsedData = rawData;
        }
    }

    var channel = (parsedData && parsedData.channel) ? parsedData.channel : "in_app";

    return {
        id: String(rawId),
        userId: rawUserId ? String(rawUserId) : null,
        title: n.title ?? n.Title,
        body: n.body ?? n.Body,
        type: n.type ?? n.Type,
        channel: channel,
        isRead: rawIsRead === 1 || rawIsRead === true,
        data: parsedData,
        createdAt: rawCreatedAt,
    };
}

export var notificationService = {
    getNotifications: function (params) {
        var p = params || {};
        return api.get("/notifications", {
            params: {
                page: p.page || 1,
                limit: p.limit || 20,
                is_read: p.unreadOnly ? false : undefined,
                type: p.type,
            },
        });
    },

    getUnreadCount: function () {
        return api.get("/notifications/unread-count");
    },

    markRead: function (notificationId) {
        return api.patch("/notifications/" + notificationId + "/read");
    },

    markAllRead: function () {
        return api.patch("/notifications/mark-all-read");
    },

    deleteNotification: function (notificationId) {
        return api.delete("/notifications/" + notificationId);
    },

    registerDeviceToken: function (token, platform) {
        return api.post("/notifications/device-token", { token: token, platform: platform });
    },
};