// src/services/notification/notificationService.js
// FoodApp (React Native / Expo customer app)
import api from "../api/base";
import { useNotificationStore } from "../../store/notificationStore";

// ── Normalise raw DB row → frontend shape ──────────────────────────────────
export function normalizeNotification(n) {
    var rawData = n.data;
    var parsedData = null;

    if (rawData) {
        if (typeof rawData === "string") {
            try { parsedData = JSON.parse(rawData); } catch (e) { parsedData = null; }
        } else {
            parsedData = rawData;
        }
    }

    // channel is embedded inside data.channel (schema has no channel column)
    var channel = (parsedData && parsedData.channel) ? parsedData.channel : "in_app";

    return {
        id: String(n.id),
        userId: String(n.user_id),
        title: n.title,
        body: n.body,
        type: n.type,
        channel: channel,
        isRead: n.is_read === 1 || n.is_read === true,
        data: parsedData,
        createdAt: n.created_at,
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