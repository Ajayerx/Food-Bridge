// components/cards/NotificationCard.js
import React, { useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from "react-native";

// ── Type config ──────────────────────────────────────────────────────────
export const TYPE_CONFIG = {
    ORDER_CONFIRMED: { icon: "✅", accent: "#22c55e", bg: "#f0fdf4", label: "Confirmed" },
    ORDER_PREPARING: { icon: "👨‍🍳", accent: "#f97316", bg: "#fff7ed", label: "Preparing" },
    ORDER_READY: { icon: "🎁", accent: "#8b5cf6", bg: "#f5f3ff", label: "Ready" },
    OUT_FOR_DELIVERY: { icon: "🛵", accent: "#3b82f6", bg: "#eff6ff", label: "On the way" },
    ORDER_DELIVERED: { icon: "🎉", accent: "#22c55e", bg: "#f0fdf4", label: "Delivered" },
    ORDER_CANCELLED: { icon: "❌", accent: "#ef4444", bg: "#fef2f2", label: "Cancelled" },
    ORDER_CANCELLED_BY_VENDOR: { icon: "😔", accent: "#ef4444", bg: "#fef2f2", label: "Cancelled" },
    REFUND_INITIATED: { icon: "🔄", accent: "#6366f1", bg: "#eef2ff", label: "Refund" },
    REFUND_COMPLETED: { icon: "💸", accent: "#22c55e", bg: "#f0fdf4", label: "Refund Done" },
    PAYMENT_RECEIVED: { icon: "💰", accent: "#22c55e", bg: "#f0fdf4", label: "Payment" },
    REVIEW_REQUEST: { icon: "✍️", accent: "#eab308", bg: "#fefce8", label: "Rate us" },
    NEW_ORDER: { icon: "🛎️", accent: "#f97316", bg: "#fff7ed", label: "New Order" },
    NEW_REVIEW: { icon: "⭐", accent: "#eab308", bg: "#fefce8", label: "Review" },
    PROMO_OFFER: { icon: "🎟️", accent: "#ec4899", bg: "#fdf2f8", label: "Promo" },
    SYSTEM: { icon: "🔔", accent: "#f97316", bg: "#fff7ed", label: "Notification" },
};
export const DEFAULT_CONFIG = { icon: "🔔", accent: "#f97316", bg: "#fff7ed", label: "Notification" };

export function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ── NotificationCard ─────────────────────────────────────────────────────
const NotificationCard = React.memo(function NotificationCard({ item, onPress }) {
    const config = TYPE_CONFIG[item.type] ?? DEFAULT_CONFIG;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 30,
            bounciness: 4,
        }).start();
    };

    return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, styles.cardWrapper]}>
            <TouchableOpacity
                style={[
                    styles.card,
                    !item.isRead && styles.cardUnread,
                ]}
                onPress={() => onPress(item)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
            >
                {/* Unread left accent bar */}
                {!item.isRead && (
                    <View style={[styles.accentBar, { backgroundColor: config.accent }]} />
                )}

                <View style={styles.innerRow}>
                    {/* Icon bubble */}
                    <View style={[styles.iconBubble, { backgroundColor: config.bg }]}>
                        {/* Coloured ring around bubble when unread */}
                        {!item.isRead && (
                            <View style={[styles.iconRing, { borderColor: config.accent + "40" }]} />
                        )}
                        <Text style={styles.iconText}>{config.icon}</Text>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {/* Top row: title + time */}
                        <View style={styles.topRow}>
                            <Text
                                style={[styles.title, item.isRead && styles.titleRead]}
                                numberOfLines={1}
                            >
                                {item.title}
                            </Text>
                            <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                        </View>

                        {/* Body */}
                        <Text
                            style={[styles.body, item.isRead && styles.bodyRead]}
                            numberOfLines={2}
                        >
                            {item.body}
                        </Text>

                        {/* Footer: label pill + unread dot */}
                        <View style={styles.footer}>
                            <View style={[styles.pill, { backgroundColor: config.accent + "18" }]}>
                                <View style={[styles.pillDot, { backgroundColor: config.accent }]} />
                                <Text style={[styles.pillText, { color: config.accent }]}>
                                    {config.label}
                                </Text>
                            </View>
                            {!item.isRead && (
                                <View style={[styles.unreadBadge, { backgroundColor: config.accent }]}>
                                    <Text style={styles.unreadBadgeText}>New</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
});

export default NotificationCard;

const styles = StyleSheet.create({
    cardWrapper: {
        marginHorizontal: 14,
        marginVertical: 5,
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        overflow: "hidden",
        // Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardUnread: {
        backgroundColor: "#fffbf7",
        shadowOpacity: 0.10,
        elevation: 3,
    },

    // Left accent bar — only shown when unread
    accentBar: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },

    innerRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        paddingLeft: 18,               // extra left pad to clear the accent bar
    },

    // Icon
    iconBubble: {
        width: 50,
        height: 50,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 13,
        flexShrink: 0,
    },
    iconRing: {
        position: "absolute",
        inset: -2,                     // equivalent to top:-2,left:-2,right:-2,bottom:-2
        borderRadius: 17,
        borderWidth: 1.5,
    },
    iconText: { fontSize: 22 },

    // Content
    content: { flex: 1, minWidth: 0 },

    topRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 6,
        marginBottom: 3,
    },
    title: {
        flex: 1,
        fontSize: 13.5,
        fontWeight: "700",
        color: "#111827",
        letterSpacing: -0.1,
    },
    titleRead: { fontWeight: "500", color: "#6b7280" },
    time: {
        fontSize: 11,
        color: "#9ca3af",
        flexShrink: 0,
        marginTop: 1,
    },

    body: {
        fontSize: 12.5,
        color: "#4b5563",
        lineHeight: 18,
        marginBottom: 8,
    },
    bodyRead: { color: "#9ca3af" },

    // Footer
    footer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    pill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 20,
    },
    pillDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    pillText: {
        fontSize: 10.5,
        fontWeight: "600",
    },
    unreadBadge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 20,
    },
    unreadBadgeText: {
        fontSize: 9.5,
        fontWeight: "700",
        color: "#fff",
        letterSpacing: 0.3,
    },
});