// screens/notification/NotificationDetailScreen.js
import React, { useEffect, useRef } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Animated, Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";
import Icon from "react-native-vector-icons/MaterialIcons";
import { resolveTypeKey, TYPE_CONFIG } from "../../utils/notificationTypes";

// ── Helpers ───────────────────────────────────────────────────────────────
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
    });
}

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ── Info row ─────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, accent, last }) {
    if (!value) return null;
    return (
        <View style={[styles.infoRow, last && styles.infoRowLast]}>
            <View style={styles.infoRowLeft}>
                {icon && <Text style={styles.infoRowIcon}>{icon}</Text>}
                <Text style={styles.infoLabel}>{label}</Text>
            </View>
            <Text style={[styles.infoValue, accent ? { color: accent } : null]}>
                {value}
            </Text>
        </View>
    );
}

// ── Main screen ───────────────────────────────────────────────────────────
export default function NotificationDetailScreen({ route, navigation }) {
    const { notification } = route.params ?? {};
    const insets = useSafeAreaInsets();

    const typeKey = resolveTypeKey(notification?.type);
    const config = TYPE_CONFIG[typeKey] ?? TYPE_CONFIG.SYSTEM;

    // Entrance animation
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(28)).current;
    const scaleAnim = useRef(new Animated.Value(0.96)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 75, friction: 10, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, tension: 75, friction: 10, useNativeDriver: true }),
        ]).start();
    }, []);

    // ── Not-found guard ───────────────────────────────────────────────────
    if (!notification) {
        return (
            <View style={[styles.container, styles.centred, { paddingTop: insets.top }]}>
                <Text style={styles.emptyIcon}>🔔</Text>
                <Text style={styles.emptyText}>Notification not found.</Text>
            </View>
        );
    }

    // ── Data extraction ───────────────────────────────────────────────────
    const orderId = notification?.data?.orderId ?? notification?.data?.order_id ?? null;
    const orderNo = notification?.data?.orderNumber ?? notification?.data?.order_number ?? null;
    const orderCode = notification?.data?.orderCode ?? notification?.data?.order_code ?? null;
    const amount = notification?.data?.amount ?? null;
    const promoCode = notification?.data?.promoCode ?? notification?.data?.promo_code ?? null;
    const discount = notification?.data?.discount ?? null;
    const restaurantName = notification?.data?.restaurantName ?? notification?.data?.restaurant_name ?? null;
    const restaurantId = notification?.data?.restaurantId ?? notification?.data?.restaurant_id ?? null;
    const replyText = notification?.data?.replyText ?? notification?.data?.reply_text ?? null;

    // ── What to show ──────────────────────────────────────────────────────
    const showOrderCode = !!(orderCode ?? orderNo) && !["NEW_REVIEW", "PROMO_OFFER"].includes(typeKey);
    const showAmount = !!amount;
    const showPromoCode = !!promoCode;
    const showDiscount = !!discount;
    const showRestaurant = !!restaurantName && ["NEW_REVIEW", "REVIEW_REQUEST"].includes(typeKey);
    const showReply = !!replyText && typeKey === "NEW_REVIEW";
    const hasAnyInfo = showOrderCode || showAmount || showPromoCode
        || showDiscount || showRestaurant || showReply;

    // ── CTAs ──────────────────────────────────────────────────────────────
    const ORDER_TYPES = [
        "ORDER_CONFIRMED", "ORDER_PREPARING", "ORDER_READY",
        "OUT_FOR_DELIVERY", "ORDER_DELIVERED", "ORDER_CANCELLED",
        "ORDER_CANCELLED_BY_VENDOR", "REFUND_INITIATED", "REFUND_COMPLETED",
        "PAYMENT_RECEIVED", "NEW_ORDER",
    ];
    const showViewOrder = !!orderId && ORDER_TYPES.includes(typeKey);

    // Show "Write a Review" for delivered orders and explicit review requests
    const showReviewCta = !!orderId && ["ORDER_DELIVERED", "REVIEW_REQUEST"].includes(typeKey);

    const handleShare = async () => {
        try {
            await Share.share({ message: `${notification.title}\n\n${notification.body}` });
        } catch (_) { }
    };

    // ── FIX: Navigate directly to ReviewScreen instead of scrolling ───────
    const goToOrder = () => {
        navigation.navigate("OrderDetailScreen", { orderId });
    };

    const goToReview = () => {
        navigation.navigate("ReviewScreen", {
            orderId: String(orderId),
            restaurantId: restaurantId ?? undefined,
            restaurantName: restaurantName ?? "Restaurant",
            orderCode: orderCode ?? orderNo ?? undefined,
            fromScreen: "notification",
        });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.headerSide}
                >
                    <Icon name="arrow-back-ios" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>

                <Text style={styles.headerTitle} pointerEvents="none">
                    Notification
                </Text>

                <View style={[styles.headerSide, { alignItems: "flex-end" }]}>
                    <TouchableOpacity
                        onPress={handleShare}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.shareBtn}
                    >
                        <Icon name="share" size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                    }}
                >
                    {/* ── Hero card ──────────────────────────────────────── */}
                    <View style={[styles.heroCard, { borderColor: config.accent + "30" }]}>
                        {/* Coloured top stripe */}
                        <View style={[styles.heroStripe, { backgroundColor: config.bg }]}>
                            {/* Decorative ring */}
                            <View style={[styles.heroRingOuter, { borderColor: config.accent + "20" }]}>
                                <View style={[styles.heroRingInner, { borderColor: config.accent + "35" }]}>
                                    <View style={[styles.heroIconBox, { backgroundColor: config.accent + "20" }]}>
                                        <Text style={styles.heroIcon}>{config.icon}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Type badge */}
                            <View style={[styles.typeBadge, { backgroundColor: config.accent }]}>
                                <Text style={styles.typeBadgeText}>{config.label}</Text>
                            </View>
                        </View>

                        {/* Text content */}
                        <View style={styles.heroBody}>
                            <Text style={styles.heroTitle}>{notification.title}</Text>
                            <Text style={styles.heroMessage}>{notification.body}</Text>

                            {/* Time row */}
                            <View style={styles.heroTimeRow}>
                                <Icon name="access-time" size={13} color="#9ca3af" />
                                <Text style={styles.heroTime}>
                                    {formatDate(notification.createdAt)}
                                    {"  ·  "}
                                    {timeAgo(notification.createdAt)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ── Info card ──────────────────────────────────────── */}
                    {hasAnyInfo && (
                        <View style={styles.infoCard}>
                            <Text style={styles.infoCardHeading}>Details</Text>

                            {showRestaurant && (
                                <InfoRow icon="🍽️" label="Restaurant" value={restaurantName} />
                            )}
                            {showReply && (
                                <InfoRow icon="💬" label="Their Reply" value={replyText} />
                            )}
                            {showOrderCode && (
                                <InfoRow
                                    icon="🧾"
                                    label="Order"
                                    value={orderCode ?? orderNo}
                                    accent={config.accent}
                                />
                            )}
                            {showAmount && (
                                <InfoRow icon="💳" label="Amount" value={`₹${amount}`} accent="#22c55e" />
                            )}
                            {showPromoCode && (
                                <InfoRow icon="🎟️" label="Promo Code" value={promoCode} accent="#ec4899" />
                            )}
                            {showDiscount && (
                                <InfoRow
                                    icon="✂️"
                                    label="Discount"
                                    value={`₹${discount} off`}
                                    accent="#22c55e"
                                    last
                                />
                            )}
                            {/* Always show date at bottom */}
                            {!showDiscount && (
                                <InfoRow
                                    icon="📅"
                                    label="Date"
                                    value={formatDate(notification.createdAt)}
                                    last
                                />
                            )}
                        </View>
                    )}

                    {/* ── CTAs ───────────────────────────────────────────── */}
                    <View style={styles.ctaGroup}>

                        {/* Review CTA — now navigates directly to ReviewScreen */}
                        {showReviewCta && (
                            <TouchableOpacity
                                style={[styles.ctaBtn, styles.ctaBtnReview]}
                                onPress={goToReview}
                                activeOpacity={0.85}
                            >
                                <View style={styles.ctaBtnInner}>
                                    <Text style={styles.ctaReviewIcon}>⭐</Text>
                                    <View>
                                        <Text style={styles.ctaBtnTitle}>Write a Review</Text>
                                        <Text style={styles.ctaBtnSub}>Share how your experience was</Text>
                                    </View>
                                </View>
                                <Icon name="chevron-right" size={22} color="#eab308" />
                            </TouchableOpacity>
                        )}

                        {/* View Order CTA */}
                        {showViewOrder && (
                            <TouchableOpacity
                                style={[styles.ctaBtn, { backgroundColor: config.accent }]}
                                onPress={goToOrder}
                                activeOpacity={0.85}
                            >
                                <View style={styles.ctaBtnInner}>
                                    <Icon name="receipt-long" size={20} color="#fff" style={{ marginRight: 10 }} />
                                    <Text style={styles.ctaBtnTextWhite}>View Order</Text>
                                </View>
                                <Icon name="chevron-right" size={22} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>

                </Animated.View>
            </ScrollView>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f3f4f6" },
    centred: { alignItems: "center", justifyContent: "center" },

    // ── Header ──
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    headerSide: { minWidth: 60 },
    headerTitle: {
        position: "absolute",
        left: 0, right: 0,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "700",
        color: Colors.textPrimary,
    },
    shareBtn: {
        width: 36, height: 36,
        alignItems: "center", justifyContent: "center",
        borderRadius: 10, backgroundColor: "#f3f4f6",
    },

    scroll: { padding: 14, paddingBottom: 48 },

    // ── Hero card ──
    heroCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 3,
    },
    // Top coloured stripe with icon
    heroStripe: {
        alignItems: "center",
        paddingTop: 32,
        paddingBottom: 20,
    },
    heroRingOuter: {
        width: 96, height: 96,
        borderRadius: 48,
        borderWidth: 1,
        alignItems: "center", justifyContent: "center",
        marginBottom: 14,
    },
    heroRingInner: {
        width: 80, height: 80,
        borderRadius: 40,
        borderWidth: 1.5,
        alignItems: "center", justifyContent: "center",
    },
    heroIconBox: {
        width: 64, height: 64,
        borderRadius: 32,
        alignItems: "center", justifyContent: "center",
    },
    heroIcon: { fontSize: 30 },
    typeBadge: {
        paddingHorizontal: 16, paddingVertical: 5,
        borderRadius: 20,
    },
    typeBadgeText: {
        color: "#fff", fontSize: 11,
        fontWeight: "700", letterSpacing: 0.7,
    },

    // Bottom white area of hero card
    heroBody: {
        padding: 20,
        alignItems: "center",
    },
    heroTitle: {
        fontSize: 18, fontWeight: "800",
        color: "#111827", textAlign: "center",
        marginBottom: 8, lineHeight: 25,
    },
    heroMessage: {
        fontSize: 13.5, color: "#6b7280",
        textAlign: "center", lineHeight: 20,
        marginBottom: 14,
    },
    heroTimeRow: {
        flexDirection: "row", alignItems: "center", gap: 5,
    },
    heroTime: { fontSize: 12, color: "#9ca3af" },

    // ── Info card ──
    infoCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        marginBottom: 12,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    infoCardHeading: {
        fontSize: 11,
        fontWeight: "700",
        color: "#9ca3af",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 4,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
        gap: 12,
    },
    infoRowLast: { borderBottomWidth: 0 },
    infoRowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    infoRowIcon: { fontSize: 14 },
    infoLabel: {
        fontSize: 13, color: "#6b7280", fontWeight: "500",
    },
    infoValue: {
        fontSize: 13, color: "#111827", fontWeight: "600",
        textAlign: "right", flex: 1, flexWrap: "wrap",
    },

    // ── CTA group ──
    ctaGroup: { gap: 10 },

    ctaBtn: {
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 3,
    },
    ctaBtnInner: {
        flexDirection: "row",
        alignItems: "center",
    },

    // Review button — white card with yellow accents
    ctaBtnReview: {
        backgroundColor: "#fff",
        borderWidth: 1.5,
        borderColor: "#fde68a",
    },
    ctaReviewIcon: { fontSize: 22, marginRight: 12 },
    ctaBtnTitle: {
        fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 1,
    },
    ctaBtnSub: {
        fontSize: 11.5, color: "#9ca3af",
    },

    // Solid colour button (view order)
    ctaBtnTextWhite: {
        fontSize: 15, fontWeight: "700", color: "#fff",
    },

    // ── Empty state ──
    emptyIcon: { fontSize: 44, opacity: 0.25, marginBottom: 10 },
    emptyText: { fontSize: 14, color: "#9ca3af" },
});