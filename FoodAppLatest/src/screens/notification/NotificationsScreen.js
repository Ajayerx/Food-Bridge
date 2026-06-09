// screens/notification/NotificationsScreen.js
import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useNotificationStore } from "../../store/notificationStore";
import { useNotifications } from "../../hooks/useNotifications";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { notificationService } from "../../services/notification/notificationService";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Colors } from "../../constants/colors";
import NotificationCard from "../../components/cards/NotificationCard";

// ── Filter helpers ───────────────────────────────────────────────────────
const FILTERS = ["All", "Orders", "Promos", "Unread"];

function filterNotifs(notifs, filter) {
    switch (filter) {
        case "Orders":
            return notifs.filter((n) =>
                [
                    "ORDER_CONFIRMED", "ORDER_PREPARING", "ORDER_READY",
                    "OUT_FOR_DELIVERY", "ORDER_DELIVERED", "ORDER_CANCELLED",
                    "ORDER_CANCELLED_BY_VENDOR",
                ].includes(n.type)
            );
        case "Promos":
            return notifs.filter((n) =>
                ["PROMO_OFFER", "REVIEW_REQUEST"].includes(n.type)
            );
        case "Unread":
            return notifs.filter((n) => !n.isRead);
        default:
            return notifs;
    }
}

// ── Main screen ──────────────────────────────────────────────────────────
export default function NotificationsScreen({ route, navigation }) {
    const userId = route?.params?.userId;
    const { notifications, badgeCount, isLoading } = useNotificationStore();
    const { markRead, markAllRead, loadMore } = useNotifications(userId);
    const insets = useSafeAreaInsets();
    const [activeFilter, setActiveFilter] = useState("All");
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);

    const filtered = filterNotifs(notifications, activeFilter);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        setPage(1);
        try {
            const res = await notificationService.getNotifications({ page: 1, limit: 30 });
            const responseData = res.data?.data;
            const items = Array.isArray(responseData?.items) ? responseData.items : [];
            const unreadCount = responseData?.unread_count ?? 0;

            useNotificationStore.getState().setNotifications(
                items.map((n) => ({
                    id: String(n.id),
                    userId: n.user_id,
                    title: n.title,
                    body: n.body,
                    type: n.type,
                    channel: n.channel ?? "in_app",
                    isRead: n.is_read === 1 || n.is_read === true,
                    data: n.data
                        ? typeof n.data === "string" ? JSON.parse(n.data) : n.data
                        : null,
                    createdAt: n.created_at,
                }))
            );
            useNotificationStore.getState().setBadgeCount(unreadCount);
        } catch (e) {
            console.error("Refresh failed:", e);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const handlePress = useCallback(
        (item) => {
            if (!item.isRead) markRead(item.id);
            navigation.navigate("NotificationDetailScreen", { notification: item });
        },
        [markRead, navigation]
    );

    const handleEndReached = useCallback(() => {
        const next = page + 1;
        setPage(next);
        loadMore(next);
    }, [page, loadMore]);

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>No notifications in this category.</Text>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation?.goBack()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.headerSide}
                >
                    <Icon name="arrow-back-ios" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>

                {/* Absolutely centred title — never pushed by side elements */}
                <Text style={styles.headerTitle} pointerEvents="none">
                    Notifications
                </Text>

                <View style={[styles.headerSide, { alignItems: "flex-end" }]}>
                    {badgeCount > 0 && (
                        <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
                            <Text style={styles.markAllText}>Mark all read</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ── Filter chips ── */}
            <View style={styles.filterRow}>
                {FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[
                            styles.filterChip,
                            activeFilter === f && styles.filterChipActive,
                        ]}
                        onPress={() => setActiveFilter(f)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                activeFilter === f && styles.filterTextActive,
                            ]}
                        >
                            {f}
                            {f === "Unread" && badgeCount > 0 ? ` (${badgeCount})` : ""}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── List ── */}
            {isLoading && filtered.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f97316" />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <NotificationCard item={item} onPress={handlePress} />
                    )}
                    ListEmptyComponent={renderEmpty}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.3}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={["#f97316"]}
                            tintColor="#f97316"
                        />
                    }
                    contentContainerStyle={[
                        styles.listContent,
                        filtered.length === 0 && styles.emptyFill,
                    ]}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f3f4f6",
    },

    // ── Header ──
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    // Both side slots are equal width so the title is always centred
    headerSide: {
        minWidth: 90,
    },
    headerTitle: {
        position: "absolute",
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "700",
        color: Colors.textPrimary,
    },
    markAllBtn: {
        backgroundColor: "#fff7ed",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#fed7aa",
    },
    markAllText: { fontSize: 12, fontWeight: "600", color: "#f97316" },

    // ── Filters ──
    filterRow: {
        flexDirection: "row",
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: "#f3f4f6",
    },
    filterChipActive: {
        backgroundColor: "#f97316",
        shadowColor: "#f97316",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 4,
    },
    filterText: { fontSize: 13, fontWeight: "500", color: "#6b7280" },
    filterTextActive: { color: "#ffffff", fontWeight: "700" },

    // ── List ──
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    listContent: {
        paddingTop: 10,
        paddingBottom: 24,
    },

    // ── Empty state ──
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    emptyFill: { flex: 1 },
    emptyIcon: { fontSize: 52, marginBottom: 14, opacity: 0.25 },
    emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151", marginBottom: 4 },
    emptySub: { fontSize: 13, color: "#9ca3af", textAlign: "center" },
});