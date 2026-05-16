import { useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";
import { useNotificationStore } from "../store/notificationStore";
import { notificationService } from "../services/notification/notificationService";
import { notificationSocket } from "../services/socket/notificationSocket";

export function useNotifications(userId) {
    const {
        addNotification,
        setBadgeCount,
        markAllReadLocal,
        setNotifications,
        setInitialized,
        isInitialized,
    } = useNotificationStore();

    // ── Fetch from API ────────────────────────────────────────────────────
    const fetchInitial = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await notificationService.getNotifications({ page: 1, limit: 30 });
            const responseData = res.data?.data;
            const items = Array.isArray(responseData?.items) ? responseData.items : [];
            const unreadCount = responseData?.unread_count ?? responseData?.unreadCount ?? 0;

            setNotifications(items.map(normalizeNotification));
            setBadgeCount(unreadCount);
            setInitialized(true);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    }, [userId, setNotifications, setBadgeCount, setInitialized]);

    // ── SignalR socket listeners ──────────────────────────────────────────
    useEffect(() => {
        if (!userId) return;

        notificationSocket.connect();

        const onNew = (notif) => {
            console.log("🔔 New notification via SignalR:", notif);
            addNotification(normalizeNotification(notif));
        };

        const onBadgeCount = (count) => {
            console.log("🔔 Badge count update:", count);
            setBadgeCount(count);
        };

        const onAllRead = () => {
            markAllReadLocal();
            setBadgeCount(0);
        };

        notificationSocket.on("receivenotification", onNew);
        notificationSocket.on("receivebadgecount", onBadgeCount);
        notificationSocket.on("allnotificationsread", onAllRead);

        if (!isInitialized) fetchInitial();

        return () => {
            notificationSocket.off("receivenotification", onNew);
            notificationSocket.off("receivebadgecount", onBadgeCount);
            notificationSocket.off("allnotificationsread", onAllRead);
        };
    }, [userId, isInitialized]);  // ✅ top-level useEffect, not nested

    // ── Re-fetch when app comes to foreground ─────────────────────────────
    useEffect(() => {
        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active" && userId) {
                useNotificationStore.getState().setInitialized(false);
                fetchInitial();
            }
        });
        return () => sub.remove();
    }, [userId, fetchInitial]);  // ✅ top-level useEffect, not nested

    // ── Actions ───────────────────────────────────────────────────────────
    const markRead = useCallback(async (id) => {
        try {
            await notificationService.markRead(id);
            useNotificationStore.getState().markReadLocal(id);
        } catch (err) {
            console.error("markRead failed:", err);
        }
    }, []);

    const markAllRead = useCallback(async () => {
        try {
            await notificationService.markAllRead();
            markAllReadLocal();
            setBadgeCount(0);
        } catch (err) {
            console.error("markAllRead failed:", err);
        }
    }, [markAllReadLocal, setBadgeCount]);

    const loadMore = useCallback(async (page) => {
        if (!userId) return;
        try {
            const res = await notificationService.getNotifications({ page, limit: 20 });
            const items = Array.isArray(res.data?.data?.items) ? res.data.data.items : [];
            useNotificationStore.getState().appendNotifications(
                items.map(normalizeNotification)
            );
        } catch (err) {
            console.error("loadMore failed:", err);
        }
    }, [userId]);

    return { markRead, markAllRead, loadMore };
}

// ── Normalize backend shape → frontend shape ──────────────────────────────
function normalizeNotification(n) {
    const normalizeType = (type) => {
        if (!type && type !== 0) return "SYSTEM";
        if (typeof type === "number") return type;
        return type
            .replace(/([A-Z])/g, '_$1')
            .toUpperCase()
            .replace(/^_/, '');
    };
    return {
        id: String(n.id),
        userId: n.user_id,
        title: n.title,
        body: n.body,
        type: normalizeType(n.type),
        channel: n.channel ?? "in_app",
        isRead: n.is_read === 1 || n.is_read === true,
        data: n.data
            ? (typeof n.data === "string" ? JSON.parse(n.data) : n.data)
            : null,
        createdAt: n.created_at,
    };
}