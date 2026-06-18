import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../hooks/useTheme';
import { useOrderStore } from '../../store/orderStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCartStore } from '../../store/cartStore';

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_MAP_LOCAL = {
    // snake_case from socket / store
    placed: 'Placed', confirmed: 'Confirmed', preparing: 'Preparing',
    ready_for_pickup: 'Ready for Pickup', out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered', completed: 'Delivered',
    cancelled: 'Cancelled', refunded: 'Refunded',
    // PascalCase from .NET API / SignalR
    Placed: 'Placed', Confirmed: 'Confirmed', Preparing: 'Preparing',
    ReadyForPickup: 'Ready for Pickup', OutForDelivery: 'Out for Delivery',
    Delivered: 'Delivered', Completed: 'Delivered',
    Cancelled: 'Cancelled', Refunded: 'Refunded',
};


// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export const OrderDetailScreen = ({ route, navigation }) => {
    const Colors = useTheme();
    const STATUS_CONFIG = {
        Placed: { color: Colors.info, icon: 'receipt-long' },
        Confirmed: { color: '#9B59B6', icon: 'check-circle' },
        Preparing: { color: '#E67E22', icon: 'restaurant' },
        'Ready for Pickup': { color: Colors.warning, icon: 'hourglass-empty' },
        'Out for Delivery': { color: Colors.primary, icon: 'delivery-dining' },
        Delivered: { color: Colors.success, icon: 'check-circle' },
        Cancelled: { color: Colors.error, icon: 'cancel' },
        Refunded: { color: '#7F8C8D', icon: 'replay' },
    };
    const styles = useMemo(() => createStyles(Colors), [Colors]);
    const { orderId } = route.params;
    const [isReordering, setIsReordering] = useState(false);

    // FIX: Always re-fetch the order from the API on mount so we never show
    // stale status from the persisted AsyncStorage cache. The old code only
    // fetched if the order was absent from the store, meaning a cached
    // "Ready for Pickup" entry would never update to "Delivered".
    useEffect(() => {
        if (orderId) {
            useOrderStore.getState().fetchOrderById(orderId);
        }
    }, [orderId]);

    const order = useOrderStore(state => state.orders.find(o => String(o.id) === String(orderId)));

    const handleReorder = useCallback(() => {
        if (!order) return;
        const items = order.items ?? [];
        const rid = order.restaurantId ?? order.restaurant_id;
        const rName = order.restaurantName ?? order.restaurant_name ?? 'Restaurant';

        if (!items.length) { Alert.alert('Cannot Reorder', 'No items found in this order.'); return; }
        if (!rid) { Alert.alert('Cannot Reorder', 'Restaurant information is missing.'); return; }

        const cartStore = useCartStore.getState();
        const cartHasConflict = cartStore.items.length > 0 && cartStore.restaurantId !== rid;

        const doAdd = () => {
            setIsReordering(true);
            try {
                cartStore.clearCart();
                items.forEach((item) => {
                    const dish = {
                        id: item.menu_item_id ?? item.id,
                        name: item.item_name ?? item.name,
                        base_price: item.unit_price ?? item.price ?? 0,
                        price: item.unit_price ?? item.price ?? 0,
                        image_url: item.image ?? null,
                        dietary_tag: item.dietary_tag ?? null,
                    };
                    const qty = item.quantity ?? 1;
                    cartStore.addItem(dish, rid, rName);
                    for (let i = 1; i < qty; i++) cartStore.addItem(dish, rid, rName);
                });
                navigation.navigate('CartScreen');
            } catch (e) {
                Alert.alert('Error', 'Failed to add items to cart. Please try again.');
            } finally {
                setIsReordering(false);
            }
        };

        if (cartHasConflict) {
            Alert.alert(
                'Replace Cart?',
                `Your cart has items from "${cartStore.restaurantName}". Replace with items from "${rName}"?`,
                [{ text: 'Cancel', style: 'cancel' }, { text: 'Yes, Replace', style: 'destructive', onPress: doAdd }]
            );
        } else {
            doAdd();
        }
    }, [order, navigation]);

    // Show spinner while the API fetch is in-flight (order not yet in store)
    if (!order) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator color={Colors.primary} size="large" />
            </SafeAreaView>
        );
    }

    const displayStatus = STATUS_MAP_LOCAL[order.order_status] || order.status || order.order_status || 'Placed';
    const isCompleted = displayStatus === 'Delivered' || order.order_status === 'completed' || order.order_status === 'Completed';
    const isCancelled = displayStatus === 'Cancelled';
    const sc = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG.Placed;

    const formattedDate = new Date(
        order.placed_at || order.createdAt || order.created_at
    ).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    const restaurantName = (order.restaurantName && order.restaurantName !== 'Restaurant')
        ? order.restaurantName
        : (order.restaurant_name || 'Restaurant');

    const handleReviewNavigate = () => {
        // Extract first item's menu_item_id so the review row in DB is populated
        const firstItem = (order.items ?? [])[0];
        const menuItemId = firstItem?.menu_item_id ?? firstItem?.id ?? null;

        navigation.navigate('ReviewScreen', {
            orderId: String(order.id),
            restaurantId: order.restaurant_id,
            restaurantName,
            orderCode: order.order_code ?? order.id,
            menuItemId,
            fromScreen: 'orderDetail',
        });
    };

    return (
        <View style={[styles.root, { backgroundColor: sc.color }]}>
            <StatusBar backgroundColor={sc.color} barStyle="light-content" />

            {/* ── Colored Header ─────────────────────────────────────────── */}
            <SafeAreaView style={styles.safeTop}>
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-back-ios" size={20} color={Colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.topBarTitle}>Order Details</Text>
                    <View style={{ width: 36 }} />
                </View>

                <View style={styles.heroSection}>
                    <View style={styles.heroLeft}>
                        <View style={styles.heroIconBox}>
                            <Icon name="restaurant" size={20} color={sc.color} />
                        </View>
                        <View style={styles.heroText}>
                            <Text style={styles.heroRestaurant} numberOfLines={1}>{restaurantName}</Text>
                            <Text style={styles.heroDate}>{formattedDate}</Text>
                            <Text style={styles.heroOrderId}>#{order.order_code ?? order.id}</Text>
                        </View>
                    </View>
                    <View style={styles.heroBadge}>
                        <Icon name={sc.icon} size={12} color={sc.color} />
                        <Text style={[styles.heroBadgeText, { color: sc.color }]}>{displayStatus}</Text>
                    </View>
                </View>
            </SafeAreaView>

            {/* ── White body ─────────────────────────────────────────────── */}
            <ScrollView
                style={styles.body}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Items ───────────────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Items</Text>
                    <View style={styles.card}>
                        {(order.items ?? []).map((item, index) => (
                            <View key={item.id || item.menu_item_id || index}>
                                <View style={styles.itemRow}>
                                    <View style={styles.itemLeft}>
                                        <View style={styles.vegDot} />
                                        <Text style={styles.itemName} numberOfLines={2}>
                                            {item.item_name ?? item.name}
                                        </Text>
                                    </View>
                                    <View style={styles.itemRight}>
                                        <Text style={styles.itemQty}>×{item.quantity ?? 1}</Text>
                                        <Text style={styles.itemPrice}>
                                            {formatCurrency((item.unit_price ?? item.price ?? 0) * (item.quantity || 1))}
                                        </Text>
                                    </View>
                                </View>
                                {index < (order.items.length - 1) && <View style={styles.divider} />}
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── Bill Details ─────────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bill Details</Text>
                    <View style={styles.card}>
                        <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Subtotal</Text>
                            <Text style={styles.billValue}>{formatCurrency(parseFloat(order.subtotal_amount || 0))}</Text>
                        </View>
                        <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Delivery Fee</Text>
                            <Text style={styles.billValue}>
                                {parseFloat(order.delivery_fee || 0) === 0
                                    ? 'Free'
                                    : formatCurrency(parseFloat(order.delivery_fee || 0))}
                            </Text>
                        </View>
                        <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Taxes & Charges</Text>
                            <Text style={styles.billValue}>{formatCurrency(parseFloat(order.tax_amount || 0))}</Text>
                        </View>
                        {parseFloat(order.discount_amount) > 0 && (
                            <View style={styles.billRow}>
                                <Text style={styles.billLabel}>
                                    Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}
                                </Text>
                                <Text style={[styles.billValue, styles.discountValue]}>
                                    − {formatCurrency(parseFloat(order.discount_amount))}
                                </Text>
                            </View>
                        )}
                        <View style={styles.billDivider} />
                        <View style={styles.billRow}>
                            <Text style={styles.totalLabel}>Total Paid</Text>
                            <Text style={[styles.totalAmount, { color: sc.color }]}>
                                {formatCurrency(parseFloat(order.total_amount || order.total || 0))}
                            </Text>
                        </View>
                        <View style={styles.paymentChip}>
                            <Icon name="payments" size={12} color={Colors.primary} />
                            <Text style={styles.paymentChipText}>
                                {String(order.payment_method || 'COD').toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── Cancellation Reason ──────────────────────────────────── */}
                {isCancelled && !!order.cancel_reason && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Cancellation Reason</Text>
                        <View style={[styles.card, styles.cancelReasonCard]}>
                            <Icon name="info-outline" size={18} color={Colors.error} />
                            <Text style={styles.cancelReasonText}>{String(order.cancel_reason)}</Text>
                        </View>
                    </View>
                )}

                {/* ── Review — Navigate to ReviewScreen ──────────────────── */}
                {isCompleted && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Review</Text>
                        <TouchableOpacity
                            style={styles.reviewNavCard}
                            onPress={handleReviewNavigate}
                            activeOpacity={0.8}
                        >
                            <View style={styles.reviewNavLeft}>
                                <View style={styles.reviewNavIconBox}>
                                    <Icon name="star" size={22} color={Colors.warning} />
                                </View>
                                <View style={styles.reviewNavText}>
                                    <Text style={styles.reviewNavTitle}>Rate Your Order</Text>
                                    <Text style={styles.reviewNavSub}>
                                        Share your experience with {restaurantName}
                                    </Text>
                                </View>
                            </View>
                            <Icon name="chevron-right" size={24} color={Colors.textLight} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Reorder ──────────────────────────────────────────────── */}
                <TouchableOpacity
                    style={[styles.reorderBtn, { backgroundColor: sc.color }, isReordering && { opacity: 0.6 }]}
                    onPress={handleReorder}
                    disabled={isReordering}
                    activeOpacity={0.85}
                >
                    {isReordering
                        ? <ActivityIndicator color={Colors.white} size="small" />
                        : <>
                            <Icon name="replay" size={18} color={Colors.white} style={{ marginRight: 8 }} />
                            <Text style={styles.reorderText}>Reorder</Text>
                        </>
                    }
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const createStyles = (C) => StyleSheet.create({
    root: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },
    safeTop: { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },

    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
    },
    backBtn: { padding: 4, width: 36 },
    topBarTitle: { fontSize: 18, fontWeight: '700', color: C.white },

    heroSection: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingBottom: 20, gap: 12,
    },
    heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    heroIconBox: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: C.surface,
        justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },
    heroText: { flex: 1, gap: 3 },
    heroRestaurant: { fontSize: 15, fontWeight: '700', color: C.white },
    heroDate: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
    heroOrderId: { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
    heroBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: C.surface,
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 20, flexShrink: 0,
    },
    heroBadgeText: { fontSize: 12, fontWeight: '700' },

    body: {
        flex: 1,
        backgroundColor: C.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },

    section: { gap: 8 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: C.textSecondary, paddingLeft: 2, letterSpacing: 0.3 },

    card: {
        backgroundColor: C.surface, borderRadius: 14,
        paddingHorizontal: 16, paddingVertical: 12,
        elevation: 1, shadowColor: C.black,
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
    },

    itemRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 10,
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    vegDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.success, flexShrink: 0 },
    itemName: { fontSize: 14, color: C.textPrimary, flex: 1 },
    itemRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    itemQty: { fontSize: 13, color: C.textSecondary, width: 28, textAlign: 'center' },
    itemPrice: { fontSize: 14, fontWeight: '600', color: C.textPrimary, width: 64, textAlign: 'right' },
    divider: { height: 1, backgroundColor: C.border },

    billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
    billLabel: { fontSize: 13, color: C.textSecondary },
    billValue: { fontSize: 13, color: C.textPrimary },
    discountValue: { color: C.success, fontWeight: '600' },
    billDivider: { height: 1, backgroundColor: C.border, marginVertical: 8 },
    totalLabel: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
    totalAmount: { fontSize: 17, fontWeight: '800' },
    paymentChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        alignSelf: 'flex-end', marginTop: 10,
        backgroundColor: C.primaryLight,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    paymentChipText: { fontSize: 11, fontWeight: '700', color: C.primary },

    cancelReasonCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.errorBorder,
    },
    cancelReasonText: { flex: 1, fontSize: 13, color: C.error, lineHeight: 20 },

    // ── Review navigation card (replaces inline ReviewCard) ──
    reviewNavCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: C.surface,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 16,
        elevation: 1,
        shadowColor: C.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    reviewNavLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    reviewNavIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: C.warning + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewNavText: { flex: 1, gap: 2 },
    reviewNavTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
    reviewNavSub: { fontSize: 12, color: C.textSecondary },

    reorderBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 15, borderRadius: 14,
    },
    reorderText: { color: C.white, fontSize: 16, fontWeight: '700' },
});
