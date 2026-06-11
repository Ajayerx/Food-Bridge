// screens/reviews/ReviewScreen.js
import React, { useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { ReviewCard } from '../../components/common/ReviewCard';
import { useOrderStore } from '../../store/orderStore';

export const ReviewScreen = ({ route, navigation }) => {
    const {
        orderId,
        restaurantId,
        restaurantName = 'Restaurant',
        orderCode,
        fromScreen,
        menuItemId: navMenuItemId,
    } = route.params ?? {};

    const displayCode = orderCode ?? orderId;

    const order = useOrderStore(state =>
        state.orders.find(o => String(o.id) === String(orderId))
    );

    useEffect(() => {
        if (orderId && !order) {
            useOrderStore.getState().fetchOrderById(orderId);
        }
    }, [orderId, order]);

    const orderItems = order?.items ?? [];

    const resolvedRestaurantId = restaurantId
        ?? order?.restaurant_id
        ?? order?.restaurantId
        ?? null;

    const resolvedRestaurantName = (restaurantName && restaurantName !== 'Restaurant')
        ? restaurantName
        : (order?.restaurantName || order?.restaurant_name || 'Restaurant');

    const resolvedMenuItemId = navMenuItemId
        ?? (orderItems.length > 0
            ? (orderItems[0].menu_item_id ?? orderItems[0].id ?? null)
            : null);

    const resolvedOrderCode = orderCode
        ?? order?.order_code
        ?? orderId;

    if (!order && orderId) {
        return (
            <View style={styles.root}>
                <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
                <SafeAreaView style={[styles.safeTop, { backgroundColor: Colors.primary }]} edges={['top']}>
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Icon name="arrow-back-ios" size={20} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.topBarCenter}>
                            <Text style={styles.topBarTitle}>Rate Your Order</Text>
                        </View>
                        <View style={{ width: 36 }} />
                    </View>
                </SafeAreaView>
                <View style={styles.loadingBody}>
                    <ActivityIndicator color={Colors.primary} size="large" />
                    <Text style={styles.loadingText}>Loading order details...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

            <SafeAreaView style={[styles.safeTop, { backgroundColor: Colors.primary }]} edges={['top']}>
                <View style={styles.topBar}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Icon name="arrow-back-ios" size={20} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.topBarCenter}>
                        <Text style={styles.topBarTitle}>Rate Your Order</Text>
                    </View>

                    <View style={{ width: 36 }} />
                </View>

                <View style={styles.contextStrip}>
                    <View style={styles.contextIconBox}>
                        <Icon name="restaurant" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.contextText}>
                        <Text style={styles.contextRestaurant} numberOfLines={1}>
                            {resolvedRestaurantName}
                        </Text>
                        <Text style={styles.contextOrder}>Order #{resolvedOrderCode}</Text>
                    </View>
                    <View style={styles.contextBadge}>
                        <Icon name="check-circle" size={12} color="#27AE60" />
                        <Text style={styles.contextBadgeText}>Delivered</Text>
                    </View>
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.body}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.promptBox}>
                    <Text style={styles.promptEmoji}>⭐</Text>
                    <Text style={styles.promptTitle}>How was your meal?</Text>
                    <Text style={styles.promptSub}>
                        Your honest review helps {resolvedRestaurantName} improve and helps
                        other customers make better choices.
                    </Text>
                </View>

                {orderItems.length > 0 && (
                    <View style={styles.itemsPreview}>
                        <Text style={styles.itemsPreviewTitle}>Your Order</Text>
                        {orderItems.map((item, idx) => (
                            <View key={item.menu_item_id ?? item.id ?? idx} style={styles.itemRow}>
                                <View style={styles.itemDot} />
                                <Text style={styles.itemName} numberOfLines={1}>
                                    {item.item_name ?? item.name ?? 'Item'}
                                </Text>
                                <Text style={styles.itemQty}>×{item.quantity ?? 1}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {orderId && resolvedRestaurantId ? (
                    <ReviewCard
                        orderId={String(orderId)}
                        restaurantId={resolvedRestaurantId}
                        menuItemId={resolvedMenuItemId}
                    />
                ) : (
                    <View style={styles.errorBox}>
                        <Icon name="error-outline" size={28} color={Colors.textLight} />
                        <Text style={styles.errorText}>
                            Order details are missing. Please go back and try again.
                        </Text>
                    </View>
                )}

                <Text style={styles.footer}>
                    Reviews are public and may be seen by other customers.
                </Text>
            </ScrollView>
        </View>
    );
};

export default ReviewScreen;

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
    // FIX: center column instead of absolute positioning
    topBarCenter: {
        flex: 1,
        alignItems: 'center',
    },
    topBarTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },

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

    loadingBody: {
        flex: 1,
        backgroundColor: Colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginTop: -1,
    },
    loadingText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },

    body: {
        flex: 1,
        backgroundColor: Colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -1,
    },
    scrollContent: {
        padding: 16,
        gap: 16,
        paddingBottom: 48,
    },

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

    itemsPreview: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        padding: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        gap: 8,
    },
    itemsPreviewTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    itemDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.success,
        flexShrink: 0,
    },
    itemName: {
        flex: 1,
        fontSize: 13,
        color: Colors.textPrimary,
    },
    itemQty: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '500',
    },

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