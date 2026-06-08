// screens/NotificationsScreen.js
import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Animated,
} from "react-native";
import { useNotificationStore } from "../../store/notificationStore";
import { useNotifications } from "../../hooks/useNotifications";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { notificationService } from "../../services/notification/notificationService";
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';


// ── Type config ──────────────────────────────────────────────────────────
const TYPE_CONFIG = {
    // ── Order statuses (these come from backend) ──
    ORDER_CONFIRMED: { icon: "✅", accent: "#22c55e", label: "Confirmed" },
    ORDER_PREPARING: { icon: "👨‍🍳", accent: "#f97316", label: "Preparing" },
    ORDER_READY: { icon: "🎁", accent: "#8b5cf6", label: "Ready" },
    OUT_FOR_DELIVERY: { icon: "🛵", accent: "#3b82f6", label: "On the way" },
    ORDER_DELIVERED: { icon: "🎉", accent: "#22c55e", label: "Delivered" },
    ORDER_CANCELLED: { icon: "❌", accent: "#ef4444", label: "Cancelled" },
    ORDER_CANCELLED_BY_VENDOR: { icon: "😔", accent: "#ef4444", label: "Cancelled" },
    REFUND_INITIATED: { icon: "🔄", accent: "#6366f1", label: "Refund" },
    REFUND_COMPLETED: { icon: "💸", accent: "#22c55e", label: "Refund Done" },
    PAYMENT_RECEIVED: { icon: "💰", accent: "#22c55e", label: "Payment" },
    REVIEW_REQUEST: { icon: "✍️", accent: "#eab308", label: "Rate us" },
    NEW_ORDER: { icon: "🛎️", accent: "#f97316", label: "New Order" },
    NEW_REVIEW: { icon: "⭐", accent: "#eab308", label: "Review" },
    PROMO_OFFER: { icon: "🎟️", accent: "#ec4899", label: "Promo" },
    SYSTEM: { icon: "🔔", accent: "#f97316", label: "Notification" },
};
const DEFAULT_CONFIG = { icon: "🔔", accent: "#f97316", label: "Notification" };

const FILTERS = ["All", "Orders", "Promos", "Unread"];

function filterNotifs(notifs, filter) {
    switch (filter) {
        case "Orders":
            return notifs.filter((n) =>
                ["ORDER_CONFIRMED", "ORDER_PREPARING", "ORDER_READY",
                    "OUT_FOR_DELIVERY", "ORDER_DELIVERED", "ORDER_CANCELLED",
                    "ORDER_CANCELLED_BY_VENDOR"].includes(n.type)
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

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ── Single row ───────────────────────────────────────────────────────────
const NotifRow = React.memo(function NotifRow({ item, onPress }) {
    const config = TYPE_CONFIG[item.type] ?? DEFAULT_CONFIG;
    return (
        <TouchableOpacity
            style={[styles.row, !item.isRead && styles.rowUnread]}
            onPress={() => onPress(item)}
            activeOpacity={0.7}
        >
            {!item.isRead && <View style={styles.unreadDot} />}
            <View style={[styles.iconBox, { backgroundColor: config.accent + "18" }]}>
                <Text style={styles.iconText}>{config.icon}</Text>
            </View>
            <View style={styles.rowContent}>
                <View style={styles.rowHeader}>
                    <Text style={[styles.rowTitle, item.isRead && styles.rowTitleRead]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={styles.rowTime}>{timeAgo(item.createdAt)}</Text>
                </View>
                <Text style={styles.rowBody} numberOfLines={2}>{item.body}</Text>
                <View style={[styles.tag, { backgroundColor: config.accent + "15" }]}>
                    <Text style={[styles.tagText, { color: config.accent }]}>{config.label}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
});

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

    // REPLACE this entire function in NotificationsScreen.js
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
                    data: n.data ? (typeof n.data === "string" ? JSON.parse(n.data) : n.data) : null,
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

    const handlePress = useCallback((item) => {
        if (!item.isRead) markRead(item.id);
        navigation.navigate("NotificationDetailScreen", { notification: item });
    }, [markRead, navigation]);

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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation?.goBack()}>
                    <Icon name="arrow-back-ios" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                {badgeCount > 0 && (
                    <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
                        <Text style={styles.markAllText}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter chips */}
            <View style={styles.filterRow}>
                {FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                        onPress={() => setActiveFilter(f)}
                    >
                        <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                            {f}
                            {f === "Unread" && badgeCount > 0 ? ` (${badgeCount})` : ""}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            {isLoading && filtered.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f97316" />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <NotifRow item={item} onPress={handlePress} />}
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
                    contentContainerStyle={filtered.length === 0 && styles.emptyFill}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9fafb",
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderColor: Colors.border,   // ← was borderBottomColor: "#f3f4f6"
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,    // ← was "#111827"
    },
    backBtn: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        backgroundColor: "#f3f4f6",
        marginRight: 10,
    },
    backIcon: { fontSize: 20, color: "#374151" },
    markAllBtn: {
        backgroundColor: "#fff7ed",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    markAllText: { fontSize: 12, fontWeight: "600", color: "#f97316" },

    filterRow: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: "#f3f4f6",
    },
    filterChipActive: { backgroundColor: "#f97316" },
    filterText: { fontSize: 13, fontWeight: "500", color: "#6b7280" },
    filterTextActive: { color: "#ffffff", fontWeight: "600" },

    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        padding: 14,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#f9fafb",
        position: "relative",
    },
    rowUnread: { backgroundColor: "#fff7ed" },
    unreadDot: {
        position: "absolute",
        left: 5,
        top: "50%",
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#f97316",
        marginTop: -3,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        flexShrink: 0,
    },
    iconText: { fontSize: 20 },
    rowContent: { flex: 1, minWidth: 0 },
    rowHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 3,
        gap: 8,
    },
    rowTitle: { flex: 1, fontSize: 13.5, fontWeight: "700", color: "#111827" },
    rowTitleRead: { fontWeight: "500", color: "#6b7280" },
    rowTime: { fontSize: 11, color: "#9ca3af", flexShrink: 0 },
    rowBody: { fontSize: 12.5, color: "#6b7280", lineHeight: 18, marginBottom: 6 },
    tag: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
    tagText: { fontSize: 10.5, fontWeight: "600" },

    emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
    emptyFill: { flex: 1 },
    emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.3 },
    emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151", marginBottom: 4 },
    emptySub: { fontSize: 13, color: "#9ca3af" },
});