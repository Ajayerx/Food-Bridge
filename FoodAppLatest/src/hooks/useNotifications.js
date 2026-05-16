import { useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";
import { useNotificationStore } from "../store/notificationStore";
import { useUserStore } from "../store/userStore";          // ✅ add this
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
export function useNotifications(userId) {
    const {
        addNotification,
        setBadgeCount,
        markAllReadLocal,
        setNotifications,
        setInitialized,
        isInitialized,
    } = useNotificationStore();

    // ── Auth guard (read directly from store, not React state) ───────────
    const isAuthed = () => {
        const { isLoggedIn, isLoggingOut } = useUserStore.getState();
        return isLoggedIn && !isLoggingOut;
    };

    // ── Fetch from API ────────────────────────────────────────────────────
    const fetchInitial = useCallback(async () => {
        if (!userId) return;
        if (!isAuthed()) return;          // ✅ guard added

        try {
            const res = await notificationService.getNotifications({ page: 1, limit: 30 });

            // ✅ Response may be null if interceptor swallowed it during logout
            if (!res) return;

            const responseData = res.data?.data;
            const items = Array.isArray(responseData?.items) ? responseData.items : [];
            const unreadCount = responseData?.unread_count ?? responseData?.unreadCount ?? 0;

            // ✅ Re-check after await — user may have logged out while fetching
            if (!isAuthed()) return;

            setNotifications(items.map(normalizeNotification));
            setBadgeCount(unreadCount);
            setInitialized(true);
        } catch (err) {
            // ✅ Suppress errors that happen mid-logout
            if (!isAuthed()) return;
            console.error("Failed to fetch notifications:", err);
        }
    }, [userId, setNotifications, setBadgeCount, setInitialized]);

    // ── SignalR socket listeners ──────────────────────────────────────────
    useEffect(() => {
        if (!userId) return;
        if (!isAuthed()) return;          // ✅ guard added

        notificationSocket.connect();

        const onNew = (notif) => {
            if (!isAuthed()) return;      // ✅ guard added
            addNotification(normalizeNotification(notif));
        };

        const onBadgeCount = (count) => {
            if (!isAuthed()) return;      // ✅ guard added
            setBadgeCount(count);
        };

        const onAllRead = () => {
            if (!isAuthed()) return;      // ✅ guard added
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
            // ✅ Disconnect socket on cleanup (logout navigates away,
            //    unmounting the component that owns this hook)
            notificationSocket.disconnect();
        };
    }, [userId, isInitialized]);

    // ── Re-fetch when app comes to foreground ─────────────────────────────
    useEffect(() => {
        const sub = AppState.addEventListener("change", (state) => {
            // ✅ isAuthed() check was completely missing here — this was
            //    the primary crash trigger after a background→foreground cycle
            if (state === "active" && userId && isAuthed()) {
                useNotificationStore.getState().setInitialized(false);
                fetchInitial();
            }
        });
        return () => sub.remove();
    }, [userId, fetchInitial]);

    // ── Actions ───────────────────────────────────────────────────────────
    const markRead = useCallback(async (id) => {
        if (!isAuthed()) return;          // ✅ guard added
        try {
            await notificationService.markRead(id);
            useNotificationStore.getState().markReadLocal(id);
        } catch (err) {
            if (!isAuthed()) return;
            console.error("markRead failed:", err);
        }
    }, []);

    const markAllRead = useCallback(async () => {
        if (!isAuthed()) return;          // ✅ guard added
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
        if (!userId || !isAuthed()) return;   // ✅ guard added
        try {
            const res = await notificationService.getNotifications({ page, limit: 20 });
            if (!res || !isAuthed()) return;  // ✅ post-await check
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