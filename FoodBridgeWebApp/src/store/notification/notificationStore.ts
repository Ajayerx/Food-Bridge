// src/store/notification/notificationStore.ts
//
// Install if missing:  npm install zustand
//
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ── Public types — re-exported so components can import from one place ─────────
export interface AppNotification {
    id: string;          // DB id cast to string (schema: char(36))
    userId: string;      // char(36) in schema
    title: string;
    body: string;
    type: string;        // NotificationType union — keep loose for extensibility
    channel: string;
    isRead: boolean;
    data: Record<string, any> | null;
    createdAt: string;
}

// ── State + actions interface ──────────────────────────────────────────────────
interface NotificationState {
    notifications: AppNotification[];
    badgeCount: number;
    isLoading: boolean;
    isInitialized: boolean;
    popupQueue: AppNotification[];   // max 5 toasts shown at once

    setNotifications: (notifications: AppNotification[]) => void;
    appendNotifications: (newItems: AppNotification[]) => void;
    addNotification: (n: AppNotification) => void;
    markReadLocal: (id: string) => void;
    markAllReadLocal: () => void;
    setBadgeCount: (count: number) => void;
    setLoading: (v: boolean) => void;
    setInitialized: (v: boolean) => void;
    dismissPopup: (id: string) => void;
    clearAll: () => void;
}

// ── Store ──────────────────────────────────────────────────────────────────────
// Replace the entire create()(persist(...)) block:

export const useNotificationStore = create<NotificationState>()(
    persist(                              // ✅ no manual generics on persist
        (set) => ({
            notifications: [],
            badgeCount: 0,
            isLoading: false,
            isInitialized: false,
            popupQueue: [],

            setNotifications: (notifications) => set({ notifications }),

            appendNotifications: (newItems) =>
                set((s) => ({
                    notifications: [
                        ...s.notifications,
                        ...newItems.filter((n) => !s.notifications.find((x) => x.id === n.id)),
                    ],
                })),

            addNotification: (n) =>
                set((s) => ({
                    notifications: [n, ...s.notifications.filter((x) => x.id !== n.id)],
                    badgeCount: s.badgeCount + (n.isRead ? 0 : 1),
                    popupQueue: [n, ...s.popupQueue].slice(0, 5),
                })),

            markReadLocal: (id) =>
                set((s) => ({
                    notifications: s.notifications.map((n) =>
                        n.id === id ? { ...n, isRead: true } : n
                    ),
                    badgeCount: Math.max(0, s.badgeCount - 1),
                })),

            markAllReadLocal: () =>
                set((s) => ({
                    notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
                    badgeCount: 0,
                })),

            setBadgeCount: (count) => set({ badgeCount: count }),
            setLoading: (isLoading) => set({ isLoading }),
            setInitialized: (isInitialized) => set({ isInitialized }),

            dismissPopup: (id) =>
                set((s) => ({ popupQueue: s.popupQueue.filter((n) => n.id !== id) })),

            clearAll: () =>
                set({ notifications: [], badgeCount: 0, popupQueue: [], isInitialized: false }),
        }),
        {
            name: "foodbridge-notifications",
            storage: createJSONStorage(() => localStorage),
            partialize: (s): Pick<NotificationState, "notifications" | "badgeCount"> => ({
                notifications: s.notifications.slice(0, 50),   // ✅ was partialState
                badgeCount: s.badgeCount,
            }),
        }
    )
);