// src/hooks/useNotifications.ts
import { useEffect, useCallback, useState } from "react";
import { useNotificationStore, AppNotification } from "../store/notification/notificationStore";
import { notificationHub } from "../services/socket.service";
import { notificationService, normalizeNotification } from "../services/notification.service";

export function useNotifications(userId?: number | string | null) {
    const {
        addNotification,
        setBadgeCount,
        markAllReadLocal,
        setLoading,
        setInitialized,
        isInitialized,
    } = useNotificationStore();

    const [permissionGranted, setPermissionGranted] = useState(false);

    // ── 1. Initial fetch from REST ─────────────────────────────────────────────
    const fetchInitial = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await notificationService.getNotifications({ page: 1, limit: 30 });
            const responseData = res.data as any;
            const items: AppNotification[] = (responseData?.data ?? []).map(normalizeNotification);
            useNotificationStore.getState().setNotifications(items);
            setBadgeCount(responseData?.meta?.unread ?? 0);
            setInitialized(true);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            setLoading(false);
        }
    }, [userId, setLoading, setBadgeCount, setInitialized]);

    // ── 2. Request browser push permission ────────────────────────────────────
    const requestPushPermission = useCallback(async () => {
        if (!("Notification" in window)) return;
        try {
            const permission = await Notification.requestPermission();
            setPermissionGranted(permission === "granted");
        } catch {
            // Permission denied silently
        }
    }, []);

    // ── 3. SignalR real-time listeners ────────────────────────────────────────
    useEffect(() => {
        if (!userId) return;

        const onNew = (notif: unknown) => {
            const normalized = normalizeNotification(notif);
            addNotification(normalized);

            // Native browser notification when tab is hidden
            // Note: `renotify` removed — not in all TS lib versions
            if (permissionGranted && typeof document !== "undefined" && document.hidden) {
                try {
                    new Notification(normalized.title, {
                        body: normalized.body,
                        icon: "/logo192.png",
                        badge: "/badge72.png",
                        tag: `notif-${normalized.id}`,
                    });
                } catch {
                    // Notification API unavailable in this context
                }
            }
        };

        notificationHub.on("receivenotification", onNew);

        if (!isInitialized) {
            fetchInitial();
            requestPushPermission();
        }

        // Refresh badge count via REST on reconnect
        const onReconnect = () => {
            fetchInitial();
        };
        notificationHub.onreconnected(onReconnect);

        return () => {
            notificationHub.off("receivenotification", onNew);
            notificationHub.offreconnected(onReconnect);
        };
    }, [userId, permissionGranted, isInitialized, addNotification, setBadgeCount, fetchInitial, requestPushPermission]);

    // ── Actions ────────────────────────────────────────────────────────────────
    const markRead = useCallback(async (id: string) => {
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

    const loadMore = useCallback(async (page: number) => {
        if (!userId) return;
        try {
            const res = await notificationService.getNotifications({ page, limit: 20 });
            const responseData = res.data as any;
            const items: AppNotification[] = (responseData?.data ?? []).map(normalizeNotification);
            useNotificationStore.getState().appendNotifications(items);
        } catch (err) {
            console.error("loadMore failed:", err);
        }
    }, [userId]);

    return { markRead, markAllRead, loadMore };
}