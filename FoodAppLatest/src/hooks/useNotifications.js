import { useEffect, useCallback } from "react";
import { AppState } from "react-native";
import { useNotificationStore } from "../store/notificationStore";
import { useUserStore } from "../store/userStore";
import { notificationService } from "../services/notification/notificationService";
import { notificationSocket } from "../services/socket/notificationSocket";

function normalizeNotification(n) {
    const normalizeType = (type) => {
        if (!type && type !== 0) return "SYSTEM";
        if (typeof type === "number") return type;
        return type
            .replace(/([A-Z])/g, '_$1')
            .toUpperCase()
            .replace(/^_/, '');
    };

    const rawId = n.id ?? n.Id;
    const rawUserId = n.user_id ?? n.userId ?? n.UserId;
    const rawIsRead = n.is_read ?? n.isRead ?? false;
    const rawCreatedAt = n.created_at ?? n.createdAt;
    const rawData = n.data ?? n.Data;

    const parsedData = rawData
        ? (typeof rawData === "string"
            ? (() => { try { return JSON.parse(rawData); } catch { return null; } })()
            : rawData)
        : null;

    return {
        id: String(rawId),
        userId: rawUserId ? String(rawUserId) : null,
        title: n.title ?? n.Title,
        body: n.body ?? n.Body,
        type: normalizeType(n.type ?? n.Type),
        channel: n.channel ?? n.Channel ?? "in_app",
        isRead: rawIsRead === 1 || rawIsRead === true,
        data: parsedData,
        createdAt: rawCreatedAt,
    };
}

export function useNotifications(userId) {
    const {
        addNotification,
        setBadgeCount,
        markAllReadLocal,
        setNotifications,
        setInitialized,
        isInitialized,
    } = useNotificationStore();

    const isAuthed = () => {
        const { isLoggedIn, isLoggingOut } = useUserStore.getState();
        return isLoggedIn && !isLoggingOut;
    };

    const fetchInitial = useCallback(async () => {
        if (!userId) return;
        if (!isAuthed()) return;

        try {
            const res = await notificationService.getNotifications({ page: 1, limit: 30 });
            if (!res) return;

            const responseData = res.data?.data;
            const items = Array.isArray(responseData?.items) ? responseData.items : [];
            const unreadCount = responseData?.unread_count ?? responseData?.unreadCount ?? 0;

            if (!isAuthed()) return;

            setNotifications(items.map(normalizeNotification));
            setBadgeCount(unreadCount);
            setInitialized(true);
        } catch (err) {
            if (!isAuthed()) return;
            console.error("Failed to fetch notifications:", err);
        }
    }, [userId, setNotifications, setBadgeCount, setInitialized]);

    useEffect(() => {
        if (!userId) return;
        if (!isAuthed()) return;

        notificationSocket.connect();

        const onNew = (notif) => {
            if (!isAuthed()) return;
            addNotification(normalizeNotification(notif));
        };

        const onBadgeCount = (count) => {
            if (!isAuthed()) return;
            setBadgeCount(count);
        };

        const onAllRead = () => {
            if (!isAuthed()) return;
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
            // ✅ DO NOT disconnect here — disconnecting on navigation unmount
            //    kills the socket for all screens and causes duplicate
            //    re-registrations on reconnect. Only disconnect on logout.
        };
    }, [userId, isInitialized]);

    useEffect(() => {
        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active" && userId && isAuthed()) {
                useNotificationStore.getState().setInitialized(false);
                fetchInitial();
            }
        });
        return () => sub.remove();
    }, [userId, fetchInitial]);

    const markRead = useCallback(async (id) => {
        if (!isAuthed()) return;
        useNotificationStore.getState().markReadLocal(id);
        try {
            await notificationService.markRead(id);
        } catch (err) {
            if (!isAuthed()) return;
            if (err?.response?.status === 404) return;
            console.error("markRead failed:", err);
        }
    }, []);

    const markAllRead = useCallback(async () => {
        if (!isAuthed()) return;
        try {
            await notificationService.markAllRead();
            markAllReadLocal();
            setBadgeCount(0);
        } catch (err) {
            if (!isAuthed()) return;
            console.error("markAllRead failed:", err);
        }
    }, [markAllReadLocal, setBadgeCount]);

    const loadMore = useCallback(async (page) => {
        if (!userId || !isAuthed()) return;
        try {
            const res = await notificationService.getNotifications({ page, limit: 20 });
            if (!res || !isAuthed()) return;
            const items = Array.isArray(res.data?.data?.items) ? res.data.data.items : [];
            useNotificationStore.getState().appendNotifications(
                items.map(normalizeNotification)
            );
        } catch (err) {
            if (!isAuthed()) return;
            console.error("loadMore failed:", err);
        }
    }, [userId]);

    return { markRead, markAllRead, loadMore };
}