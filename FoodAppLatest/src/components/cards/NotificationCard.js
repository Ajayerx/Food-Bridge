// components/cards/NotificationCard.js
import React, { useRef, useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { TYPE_CONFIG, DEFAULT_CONFIG, resolveTypeKey } from "../../utils/notificationTypes";

export function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ── NotificationCard ─────────────────────────────────────────────────────
const NotificationCard = React.memo(function NotificationCard({ item, onPress }) {
    // ✅ FIX: resolve raw type (number / PascalCase) → SCREAMING_SNAKE_CASE key
    const resolvedType = resolveTypeKey(item.type);
    const config = TYPE_CONFIG[resolvedType] ?? DEFAULT_CONFIG;
    const Colors = useTheme();
    const styles = useMemo(() => createStyles(Colors), [Colors]);
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

const createStyles = (C) => StyleSheet.create({
    cardWrapper: {
        marginHorizontal: 14,
        marginVertical: 5,
    },
    card: {
        backgroundColor: C.surface,
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: C.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardUnread: {
        backgroundColor: C.cardBg,
        shadowOpacity: 0.10,
        elevation: 3,
    },

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
        paddingLeft: 18,
    },

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
        inset: -2,
        borderRadius: 17,
        borderWidth: 1.5,
    },
    iconText: { fontSize: 22 },

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
        color: C.textPrimary,
        letterSpacing: -0.1,
    },
    titleRead: { fontWeight: "500", color: C.textLight },
    time: {
        fontSize: 11,
        color: C.textLight,
        flexShrink: 0,
        marginTop: 1,
    },

    body: {
        fontSize: 12.5,
        color: C.textSecondary,
        lineHeight: 18,
        marginBottom: 8,
    },
    bodyRead: { color: C.textLight },

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
        color: C.white,
        letterSpacing: 0.3,
    },
});