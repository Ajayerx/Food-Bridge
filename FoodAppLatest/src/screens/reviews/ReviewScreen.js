// screens/reviews/ReviewScreen.js
import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { ReviewCard } from '../../components/common/ReviewCard';

// ─────────────────────────────────────────────────────────────────────────────
// Navigation params expected:
//   orderId        string  — required
//   restaurantId   string  — required
//   restaurantName string  — for display (optional, falls back to "Restaurant")
//   orderCode      string  — for display (optional, falls back to orderId)
//   fromScreen     string  — "tracking" | "orderDetail" | "notification" (optional)
// ─────────────────────────────────────────────────────────────────────────────

export const ReviewScreen = ({ route, navigation }) => {
    const {
        orderId,
        restaurantId,
        restaurantName = 'Restaurant',
        orderCode,
        fromScreen,
    } = route.params ?? {};

    const displayCode = orderCode ?? orderId;

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

            {/* ── Coloured header — matches OrderDetailScreen pattern ── */}
            <SafeAreaView style={[styles.safeTop, { backgroundColor: Colors.primary }]} edges={['top']}>
                <View style={styles.topBar}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Icon name="arrow-back-ios" size={20} color="#fff" />
                    </TouchableOpacity>

                    {/* Absolutely centred title — never pushed by back button */}
                    <Text style={styles.topBarTitle} pointerEvents="none">
                        Rate Your Order
                    </Text>

                    {/* Right placeholder to keep title centred */}
                    <View style={{ width: 36 }} />
                </View>

                {/* Context strip under header */}
                <View style={styles.contextStrip}>
                    <View style={styles.contextIconBox}>
                        <Icon name="restaurant" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.contextText}>
                        <Text style={styles.contextRestaurant} numberOfLines={1}>
                            {restaurantName}
                        </Text>
                        <Text style={styles.contextOrder}>Order #{displayCode}</Text>
                    </View>
                    <View style={styles.contextBadge}>
                        <Icon name="check-circle" size={12} color="#27AE60" />
                        <Text style={styles.contextBadgeText}>Delivered</Text>
                    </View>
                </View>
            </SafeAreaView>

            {/* ── White scrollable body ── */}
            <ScrollView
                style={styles.body}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Prompt text */}
                <View style={styles.promptBox}>
                    <Text style={styles.promptEmoji}>⭐</Text>
                    <Text style={styles.promptTitle}>How was your meal?</Text>
                    <Text style={styles.promptSub}>
                        Your honest review helps {restaurantName} improve and helps
                        other customers make better choices.
                    </Text>
                </View>

                {/* The single canonical ReviewCard */}
                {orderId && restaurantId ? (
                    <ReviewCard
                        orderId={String(orderId)}
                        restaurantId={restaurantId}
                    />
                ) : (
                    <View style={styles.errorBox}>
                        <Icon name="error-outline" size={28} color={Colors.textLight} />
                        <Text style={styles.errorText}>
                            Order details are missing. Please go back and try again.
                        </Text>
                    </View>
                )}

                {/* Small footer nudge */}
                <Text style={styles.footer}>
                    Reviews are public and may be seen by other customers.
                </Text>
            </ScrollView>
        </View>
    );
};

export default ReviewScreen;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },

    safeTop: { backgroundColor: Colors.primary },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    backBtn: { padding: 4, width: 36 },
    topBarTitle: {
        position: 'absolute',
        left: 0, right: 0,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },

    // Context strip — restaurant name + order code + "Delivered" badge
    contextStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 20,
        gap: 12,
    },
    contextIconBox: {
        width: 44, height: 44,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    contextText: { flex: 1, gap: 3 },
    contextRestaurant: {
        fontSize: 15, fontWeight: '700', color: '#fff',
    },
    contextOrder: {
        fontSize: 12, color: 'rgba(255,255,255,0.75)',
    },
    contextBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        flexShrink: 0,
    },
    contextBadgeText: {
        fontSize: 12, fontWeight: '700', color: '#27AE60',
    },

    // Body
    body: {
        flex: 1,
        backgroundColor: Colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -1, // tuck under header curve
    },
    scrollContent: {
        padding: 16,
        gap: 16,
        paddingBottom: 48,
    },

    // Prompt
    promptBox: {
        alignItems: 'center',
        paddingVertical: 8,
        gap: 6,
    },
    promptEmoji: { fontSize: 36 },
    promptTitle: {
        fontSize: 20, fontWeight: '800', color: Colors.textPrimary,
    },
    promptSub: {
        fontSize: 13, color: Colors.textSecondary,
        textAlign: 'center', lineHeight: 20,
        paddingHorizontal: 16,
    },

    // Error guard
    errorBox: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        gap: 12,
    },
    errorText: {
        fontSize: 13, color: Colors.textSecondary,
        textAlign: 'center', lineHeight: 20,
    },

    footer: {
        fontSize: 11,
        color: Colors.textLight,
        textAlign: 'center',
        paddingHorizontal: 24,
    },
});