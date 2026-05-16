// src/store/notificationStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useNotificationStore = create()(
    persist(
        (set) => ({
            // ── Initial state ──────────────────────────────────────────────────
            notifications: [],
            badgeCount: 0,
            isLoading: false,
            isInitialized: false,
            popupQueue: [],

            // ── Actions ───────────────────────────────────────────────────────
            setNotifications: (notifications) => set({ notifications }),

            appendNotifications: (newItems) =>
                set((s) => ({
                    notifications: [
                        ...s.notifications,
                        ...newItems.filter((n) => !s.notifications.find((x) => x.id === n.id)),
                    ],
                })),

            addNotification: (n) =>
                set((s) => {
                    // ✅ Skip if notification already exists — prevents duplicate from double mount
                    if (s.notifications.find((x) => x.id === n.id)) return s;
                    return {
                        notifications: [n, ...s.notifications],
                        badgeCount: s.badgeCount + (n.isRead ? 0 : 1),
                        popupQueue: [n, ...s.popupQueue].slice(0, 5),
                    };
                }),

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
            storage: createJSONStorage(() => AsyncStorage), // ✅ AsyncStorage, not localStorage
            partialize: (s) => ({                           // ✅ no TS annotation in .js
                notifications: s.notifications.slice(0, 50),
                badgeCount: s.badgeCount,
            }),
        }
    )
);