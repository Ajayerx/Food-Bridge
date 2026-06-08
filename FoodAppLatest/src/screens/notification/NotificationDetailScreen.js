// screens/notification/NotificationDetailScreen.js

import React, { useEffect, useRef } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Animated, Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from '../../constants/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';


// ── Numeric enum → string key mapper ─────────────────────────────────────────
const NUMERIC_TO_KEY = {
    0: "SYSTEM",
    1: "PROMO_OFFER",
    2: "SYSTEM",
    3: "ORDER_CONFIRMED",
    4: "ORDER_PREPARING",
    5: "ORDER_READY",
    6: "OUT_FOR_DELIVERY",
    7: "ORDER_DELIVERED",
    8: "ORDER_CANCELLED",
    9: "ORDER_CANCELLED_BY_VENDOR",
    10: "REFUND_INITIATED",
    11: "REFUND_COMPLETED",
    12: "PAYMENT_RECEIVED",
    13: "REVIEW_REQUEST",
    14: "NEW_ORDER",
    15: "NEW_REVIEW",
    16: "ORDER_CONFIRMED",
};

// ── String → key mapper ───────────────────────────────────────────────────────
const STRING_TO_KEY = {
    System: "SYSTEM",
    Promotion: "PROMO_OFFER",
    Support: "SYSTEM",
    OrderConfirmed: "ORDER_CONFIRMED",
    OrderPreparing: "ORDER_PREPARING",
    OrderReady: "ORDER_READY",
    OutForDelivery: "OUT_FOR_DELIVERY",
    OrderDelivered: "ORDER_DELIVERED",
    OrderCancelled: "ORDER_CANCELLED",
    OrderCancelledByVendor: "ORDER_CANCELLED_BY_VENDOR",
    RefundInitiated: "REFUND_INITIATED",
    RefundCompleted: "REFUND_COMPLETED",
    PaymentReceived: "PAYMENT_RECEIVED",
    ReviewRequest: "REVIEW_REQUEST",
    NewOrder: "NEW_ORDER",
    NewReview: "NEW_REVIEW",
    OrderUpdate: "ORDER_CONFIRMED",
    ORDER_CONFIRMED: "ORDER_CONFIRMED",
    ORDER_PREPARING: "ORDER_PREPARING",
    ORDER_READY: "ORDER_READY",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    ORDER_DELIVERED: "ORDER_DELIVERED",
    ORDER_CANCELLED: "ORDER_CANCELLED",
    ORDER_CANCELLED_BY_VENDOR: "ORDER_CANCELLED_BY_VENDOR",
    REFUND_INITIATED: "REFUND_INITIATED",
    REFUND_COMPLETED: "REFUND_COMPLETED",
    PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
    REVIEW_REQUEST: "REVIEW_REQUEST",
    NEW_ORDER: "NEW_ORDER",
    NEW_REVIEW: "NEW_REVIEW",
    PROMO_OFFER: "PROMO_OFFER",
    SYSTEM: "SYSTEM",
};

function resolveTypeKey(type) {
    if (type === null || type === undefined) return "SYSTEM";
    if (typeof type === "number") return NUMERIC_TO_KEY[type] ?? "SYSTEM";
    return STRING_TO_KEY[String(type)] ?? "SYSTEM";
}

// ── TYPE_CONFIG ───────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
    ORDER_CONFIRMED: { icon: "✅", accent: "#22c55e", label: "Order Confirmed", bg: "#f0fdf4" },
    ORDER_PREPARING: { icon: "👨‍🍳", accent: "#f97316", label: "Being Prepared", bg: "#fff7ed" },
    ORDER_READY: { icon: "🎁", accent: "#8b5cf6", label: "Ready for Pickup", bg: "#faf5ff" },
    OUT_FOR_DELIVERY: { icon: "🛵", accent: "#3b82f6", label: "Out for Delivery", bg: "#eff6ff" },
    ORDER_DELIVERED: { icon: "🎉", accent: "#22c55e", label: "Delivered", bg: "#f0fdf4" },
    ORDER_CANCELLED: { icon: "❌", accent: "#ef4444", label: "Order Cancelled", bg: "#fef2f2" },
    ORDER_CANCELLED_BY_VENDOR: { icon: "😔", accent: "#ef4444", label: "Cancelled by Vendor", bg: "#fef2f2" },
    REFUND_INITIATED: { icon: "🔄", accent: "#6366f1", label: "Refund Initiated", bg: "#eef2ff" },
    REFUND_COMPLETED: { icon: "💸", accent: "#22c55e", label: "Refund Completed", bg: "#f0fdf4" },
    PAYMENT_RECEIVED: { icon: "💰", accent: "#22c55e", label: "Payment Received", bg: "#f0fdf4" },
    REVIEW_REQUEST: { icon: "✍️", accent: "#eab308", label: "Rate Your Order", bg: "#fefce8" },
    NEW_ORDER: { icon: "🛎️", accent: "#f97316", label: "New Order", bg: "#fff7ed" },
    NEW_REVIEW: { icon: "⭐", accent: "#eab308", label: "New Review", bg: "#fefce8" },
    PROMO_OFFER: { icon: "🎟️", accent: "#ec4899", label: "Promo & Offer", bg: "#fdf2f8" },
    SYSTEM: { icon: "🔔", accent: "#f97316", label: "Notification", bg: "#fff7ed" },
};

// ── Format date ───────────────────────────────────────────────────────────────
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
    });
}

// ── Time ago ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ── Info Row — minimal label + value ──────────────────────────────────────────
function InfoRow({ label, value, accent }) {
    if (!value) return null;
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, accent ? { color: accent } : null]}>{value}</Text>
        </View>
    );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function NotificationDetailScreen({ route, navigation }) {
    const { notification } = route.params ?? {};
    const insets = useSafeAreaInsets();

    const typeKey = resolveTypeKey(notification?.type);
    const config = TYPE_CONFIG[typeKey] ?? TYPE_CONFIG.SYSTEM;

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
        ]).start();
    }, []);

    if (!notification) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, alignItems: "center", justifyContent: "center" }]}>
                <Text style={{ fontSize: 36 }}>🔔</Text>
                <Text style={{ color: "#9ca3af", marginTop: 8, fontSize: 14 }}>Notification not found.</Text>
            </View>
        );
    }

    // ── Data extraction ───────────────────────────────────────────────────────
    const orderId = notification?.data?.orderId ?? notification?.data?.order_id ?? null;
    const orderNo = notification?.data?.orderNumber ?? notification?.data?.order_number ?? null;
    const orderCode = notification?.data?.orderCode ?? notification?.data?.order_code ?? null;
    const amount = notification?.data?.amount ?? null;
    const promoCode = notification?.data?.promoCode ?? notification?.data?.promo_code ?? null;
    const discount = notification?.data?.discount ?? null;
    const restaurantName = notification?.data?.restaurantName ?? notification?.data?.restaurant_name ?? null;
    const replyText = notification?.data?.replyText ?? notification?.data?.reply_text ?? null;

    const handleShare = async () => {
        try { await Share.share({ message: `${notification.title}\n\n${notification.body}` }); }
        catch (_) { }
    };

    // ── What info rows to show per type ──────────────────────────────────────
    // Each type shows only what's relevant — no generic dump of all fields
    const showOrderCode = !!(orderCode ?? orderNo) && typeKey !== "NEW_REVIEW" && typeKey !== "PROMO_OFFER";
    const showAmount = !!amount;
    const showPromoCode = !!promoCode;
    const showDiscount = !!discount;
    const showRestaurant = !!restaurantName && (typeKey === "NEW_REVIEW" || typeKey === "REVIEW_REQUEST");
    const showReply = !!replyText && typeKey === "NEW_REVIEW";
    const showReplyOrderId = !!orderId && typeKey === "NEW_REVIEW";

    const hasAnyInfo = showOrderCode || showAmount || showPromoCode
        || showDiscount || showRestaurant || showReply || showReplyOrderId;

    // ── CTA: only for order-related types ────────────────────────────────────
    const showViewOrder = !!orderId && [
        "ORDER_CONFIRMED", "ORDER_PREPARING", "ORDER_READY",
        "OUT_FOR_DELIVERY", "ORDER_DELIVERED", "ORDER_CANCELLED",
        "ORDER_CANCELLED_BY_VENDOR", "REFUND_INITIATED", "REFUND_COMPLETED",
        "PAYMENT_RECEIVED", "REVIEW_REQUEST", "NEW_ORDER",
    ].includes(typeKey);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back-ios" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notification</Text>
                <TouchableOpacity onPress={handleShare}>
                    <Icon name="share" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

                    {/* ── Hero card ────────────────────────────────────────── */}
                    <View style={[styles.heroCard, { backgroundColor: config.bg, borderColor: config.accent + "25" }]}>
                        {/* Icon */}
                        <View style={[styles.heroIconBox, { backgroundColor: config.accent + "18" }]}>
                            <Text style={styles.heroIcon}>{config.icon}</Text>
                        </View>

                        {/* Badge */}
                        <View style={[styles.typeBadge, { backgroundColor: config.accent }]}>
                            <Text style={styles.typeBadgeText}>{config.label}</Text>
                        </View>

                        {/* Title & body */}
                        <Text style={styles.heroTitle}>{notification.title}</Text>
                        <Text style={styles.heroBody}>{notification.body}</Text>

                        {/* Time */}
                        <Text style={styles.heroTime}>
                            {formatDate(notification.createdAt)}  ·  {timeAgo(notification.createdAt)}
                        </Text>
                    </View>

                    {/* ── Info card — only if there's something to show ────── */}
                    {hasAnyInfo && (
                        <View style={styles.infoCard}>
                            {/* NEW_REVIEW: restaurant name + reply + order ref */}
                            {showRestaurant && <InfoRow label="Restaurant" value={restaurantName} />}
                            {showReply && <InfoRow label="Reply" value={replyText} />}

                            {showReplyOrderId && <InfoRow label="Order" value={orderCode ?? orderNo ?? orderId} accent={config.accent} />}

                            {/* Order-based types */}
                            {showOrderCode && <InfoRow label="Order" value={orderCode ?? orderNo} accent={config.accent} />}
                            {showAmount && <InfoRow label="Amount" value={`₹${amount}`} accent="#22c55e" />}

                            {/* Promo types */}
                            {showPromoCode && <InfoRow label="Promo Code" value={promoCode} accent="#ec4899" />}
                            {showDiscount && <InfoRow label="Discount" value={`₹${discount} off`} accent="#22c55e" />}

                            {/* Always show date at bottom of info card */}
                            <InfoRow label="Date" value={formatDate(notification.createdAt)} />
                        </View>
                    )}

                    {/* ── CTA ──────────────────────────────────────────────── */}
                    {showViewOrder && (
                        <TouchableOpacity
                            style={[styles.ctaBtn, { backgroundColor: config.accent }]}
                            onPress={() => navigation.navigate("OrderDetailScreen", { orderId })}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.ctaBtnText}>View Order →</Text>
                        </TouchableOpacity>
                    )}

                </Animated.View>
            </ScrollView>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f9fafb" },

    // Header
    header: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: "#fff",
        borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
    },
    backBtn: {
        width: 36, height: 36, alignItems: "center", justifyContent: "center",
        borderRadius: 10, backgroundColor: "#f3f4f6", marginRight: 10,
    },
    backIcon: { fontSize: 20, color: "#374151" },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: "#111827" },
    shareBtn: {
        width: 36, height: 36, alignItems: "center", justifyContent: "center",
        borderRadius: 10, backgroundColor: "#f3f4f6",
    },
    shareIcon: { fontSize: 16, color: "#374151" },

    scroll: { padding: 16, gap: 12, paddingBottom: 48 },

    // Hero card
    heroCard: {
        borderRadius: 20, padding: 24,
        alignItems: "center", borderWidth: 1,
    },
    heroIconBox: {
        width: 68, height: 68, borderRadius: 18,
        alignItems: "center", justifyContent: "center", marginBottom: 14,
    },
    heroIcon: { fontSize: 34 },
    typeBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, marginBottom: 14 },
    typeBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
    heroTitle: { fontSize: 19, fontWeight: "800", color: "#111827", textAlign: "center", marginBottom: 8, lineHeight: 26 },
    heroBody: { fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 21, marginBottom: 16 },
    heroTime: { fontSize: 12, color: "#9ca3af" },

    // Info card — minimal rows
    infoCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: "#f3f4f6",
        overflow: "hidden",
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
        gap: 12,
    },
    infoLabel: {
        fontSize: 13, color: "#9ca3af", fontWeight: "500",
        flexShrink: 0,
    },
    infoValue: {
        fontSize: 13, color: "#111827", fontWeight: "600",
        textAlign: "right", flex: 1, flexWrap: "wrap",
    },

    // CTA
    ctaBtn: {
        borderRadius: 14, paddingVertical: 15,
        alignItems: "center", justifyContent: "center",
        marginTop: 4,
    },
    ctaBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});