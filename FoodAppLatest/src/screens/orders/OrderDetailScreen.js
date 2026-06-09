import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    TextInput,
    Alert,
    ScrollView,
    StatusBar,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { useOrderStore } from '../../store/orderStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { submitReview, getOrderReview } from '../../services/review/reviewService';
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

const STATUS_CONFIG = {
    Placed: { color: '#3498DB', icon: 'receipt-long' },
    Confirmed: { color: '#9B59B6', icon: 'check-circle' },
    Preparing: { color: '#E67E22', icon: 'restaurant' },
    'Ready for Pickup': { color: '#F39C12', icon: 'hourglass-empty' },
    'Out for Delivery': { color: Colors.primary, icon: 'delivery-dining' },
    Delivered: { color: '#27AE60', icon: 'check-circle' },
    Cancelled: { color: '#E53935', icon: 'cancel' },
    Refunded: { color: '#7F8C8D', icon: 'replay' },
};

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW CARD
// ─────────────────────────────────────────────────────────────────────────────
const ReviewCard = ({ orderId, restaurantId }) => {
    const [selected, setSelected] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [existingReview, setExistingReview] = useState(null);
    const [loadingExisting, setLoadingExisting] = useState(true);

    useEffect(() => {
        let cancelled = false;
        let pollInterval = null;

        const fetchReview = async () => {
            try {
                const review = await getOrderReview(orderId);
                if (cancelled) return;
                if (review) {
                    setExistingReview(review);
                    setSubmitted(true);
                    setSelected(review.rating);
                    if (review.vendor_reply && pollInterval) {
                        clearInterval(pollInterval);
                        pollInterval = null;
                    }
                }
            } catch (e) { }
            finally {
                if (!cancelled) setLoadingExisting(false);
            }
        };

        fetchReview();
        pollInterval = setInterval(() => {
            if (!cancelled) fetchReview();
        }, 30000);

        return () => {
            cancelled = true;
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [orderId]);

    const handleSubmit = useCallback(async () => {
        if (selected === 0) {
            Alert.alert('Rate your experience', 'Please select at least 1 star before submitting.');
            return;
        }
        setSubmitting(true);
        try {
            await submitReview(orderId, {
                rating: selected,
                comment: comment.trim() || undefined,
                restaurantId,
            });
            const review = await getOrderReview(orderId);
            if (review) setExistingReview(review);
            setSubmitted(true);
        } catch (err) {
            const msg = err?.response?.data?.error?.message ?? 'Failed to submit review. Please try again.';
            Alert.alert('Error', msg);
        } finally {
            setSubmitting(false);
        }
    }, [orderId, selected, comment]);

    if (loadingExisting) {
        return <View style={rvStyles.card}><ActivityIndicator color={Colors.primary} /></View>;
    }

    if (submitted && existingReview) {
        return (
            <View style={rvStyles.card}>
                <View style={rvStyles.thankRow}>
                    <Text style={rvStyles.thankEmoji}>🙏</Text>
                    <Text style={rvStyles.thankTitle}>Thanks for your review!</Text>
                </View>
                <View style={rvStyles.starsRowSmall}>
                    {[1, 2, 3, 4, 5].map(s => (
                        <Icon key={s} name={s <= existingReview.rating ? 'star' : 'star-border'}
                            size={22} color={s <= existingReview.rating ? '#F39C12' : Colors.border} />
                    ))}
                </View>
                {existingReview.comment ? (
                    <Text style={rvStyles.savedComment}>"{existingReview.comment}"</Text>
                ) : null}
                {existingReview.vendor_reply ? (
                    <View style={rvStyles.replyBox}>
                        <View style={rvStyles.replyHeader}>
                            <View style={rvStyles.replyIconCircle}>
                                <Icon name="store" size={13} color="#fff" />
                            </View>
                            <View>
                                <Text style={rvStyles.replyFrom}>Restaurant's Response</Text>
                                {existingReview.replied_at && (
                                    <Text style={rvStyles.replyDate}>
                                        {new Date(existingReview.replied_at).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                        })}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <View style={rvStyles.replyDivider} />
                        <Text style={rvStyles.replyText}>"{existingReview.vendor_reply}"</Text>
                    </View>
                ) : (
                    <View style={rvStyles.awaitingBox}>
                        <Icon name="hourglass-empty" size={14} color={Colors.textLight} />
                        <Text style={rvStyles.awaitingReply}>Awaiting restaurant reply</Text>
                    </View>
                )}
            </View>
        );
    }

    if (submitted) {
        return (
            <View style={rvStyles.card}>
                <View style={rvStyles.thankRow}>
                    <Text style={rvStyles.thankEmoji}>🎉</Text>
                    <Text style={rvStyles.thankTitle}>Review submitted!</Text>
                </View>
                <Text style={rvStyles.thankSub}>The restaurant has been notified.</Text>
            </View>
        );
    }

    return (
        <View style={rvStyles.card}>
            <Text style={rvStyles.title}>How was your experience?</Text>
            <Text style={rvStyles.sub}>Your feedback helps others make better choices.</Text>
            <View style={rvStyles.starsRow}>
                {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity key={star} onPress={() => setSelected(star)} activeOpacity={0.7}>
                        <Icon name={star <= selected ? 'star' : 'star-border'}
                            size={40} color={star <= selected ? '#F39C12' : Colors.border} />
                    </TouchableOpacity>
                ))}
            </View>
            {selected > 0 && (
                <Text style={rvStyles.starLabel}>
                    {['', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Great 😄', 'Excellent 🤩'][selected]}
                </Text>
            )}
            <TextInput
                style={rvStyles.commentInput}
                placeholder="Share details about your experience (optional)"
                placeholderTextColor="#bbb"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                maxLength={300}
                textAlignVertical="top"
            />
            <Text style={rvStyles.charCount}>{comment.length}/300</Text>
            <TouchableOpacity
                style={[rvStyles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
            >
                {submitting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <><Icon name="send" size={18} color="#fff" /><Text style={rvStyles.submitText}>Submit Review</Text></>
                }
            </TouchableOpacity>
        </View>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export const OrderDetailScreen = ({ route, navigation }) => {
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

    return (
        <View style={[styles.root, { backgroundColor: sc.color }]}>
            <StatusBar backgroundColor={sc.color} barStyle="light-content" />

            {/* ── Colored Header ─────────────────────────────────────────── */}
            <SafeAreaView style={styles.safeTop}>
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-back-ios" size={20} color="#fff" />
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
                            <Icon name="info-outline" size={18} color="#E53935" />
                            <Text style={styles.cancelReasonText}>{String(order.cancel_reason)}</Text>
                        </View>
                    </View>
                )}

                {/* ── Review ───────────────────────────────────────────────── */}
                {isCompleted && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Review</Text>
                        <ReviewCard
                            orderId={String(order.id)}
                            restaurantId={order.restaurant_id}
                        />
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
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <>
                            <Icon name="replay" size={18} color="#fff" style={{ marginRight: 8 }} />
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
const styles = StyleSheet.create({
    root: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    safeTop: { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },

    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
    },
    backBtn: { padding: 4, width: 36 },
    topBarTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },

    heroSection: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingBottom: 20, gap: 12,
    },
    heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    heroIconBox: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },
    heroText: { flex: 1, gap: 3 },
    heroRestaurant: { fontSize: 15, fontWeight: '700', color: '#fff' },
    heroDate: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
    heroOrderId: { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
    heroBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#fff',
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 20, flexShrink: 0,
    },
    heroBadgeText: { fontSize: 12, fontWeight: '700' },

    body: {
        flex: 1,
        backgroundColor: Colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },

    section: { gap: 8 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, paddingLeft: 2, letterSpacing: 0.3 },

    card: {
        backgroundColor: Colors.white, borderRadius: 14,
        paddingHorizontal: 16, paddingVertical: 12,
        elevation: 1, shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
    },

    itemRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 10,
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    vegDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success, flexShrink: 0 },
    itemName: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
    itemRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    itemQty: { fontSize: 13, color: Colors.textSecondary, width: 28, textAlign: 'center' },
    itemPrice: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, width: 64, textAlign: 'right' },
    divider: { height: 1, backgroundColor: Colors.border },

    billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
    billLabel: { fontSize: 13, color: Colors.textSecondary },
    billValue: { fontSize: 13, color: Colors.textPrimary },
    discountValue: { color: '#27AE60', fontWeight: '600' },
    billDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
    totalLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
    totalAmount: { fontSize: 17, fontWeight: '800' },
    paymentChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        alignSelf: 'flex-end', marginTop: 10,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    paymentChipText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

    cancelReasonCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FADBD8',
    },
    cancelReasonText: { flex: 1, fontSize: 13, color: '#E53935', lineHeight: 20 },

    reorderBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 15, borderRadius: 14,
    },
    reorderText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

const rvStyles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white, borderRadius: 16, padding: 20,
        elevation: 1, shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
        alignItems: 'center', gap: 10,
    },
    title: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
    sub: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
    starsRow: { flexDirection: 'row', gap: 6, marginVertical: 4 },
    starsRowSmall: { flexDirection: 'row', gap: 3 },
    starLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    commentInput: {
        width: '100%', borderWidth: 1, borderColor: Colors.border,
        borderRadius: 12, padding: 12, fontSize: 13,
        color: Colors.textPrimary, minHeight: 80,
    },
    charCount: { alignSelf: 'flex-end', fontSize: 11, color: Colors.textLight },
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 13, paddingHorizontal: 28,
        borderRadius: 14, marginTop: 4,
    },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    thankRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    thankEmoji: { fontSize: 28 },
    thankTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
    thankSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
    savedComment: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
    replyBox: {
        alignSelf: 'stretch', marginTop: 8, borderRadius: 14,
        borderWidth: 1, borderColor: '#E0EDFF',
        backgroundColor: '#F5F9FF', overflow: 'hidden',
    },
    replyHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#EAF2FF',
    },
    replyIconCircle: {
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    replyFrom: { fontSize: 12, fontWeight: '700', color: Colors.primary, letterSpacing: 0.2 },
    replyDate: { fontSize: 10, color: '#7aA8D8', marginTop: 1 },
    replyDivider: { height: 1, backgroundColor: '#D8EAFF' },
    replyText: {
        fontSize: 13, color: '#2C4A6E', fontStyle: 'italic',
        lineHeight: 20, paddingHorizontal: 14, paddingVertical: 12,
    },
    awaitingBox: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        alignSelf: 'stretch', marginTop: 8,
        paddingVertical: 10, paddingHorizontal: 14,
        backgroundColor: '#FAFAFA', borderRadius: 10,
        borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
    },
    awaitingReply: { fontSize: 12, color: Colors.textLight, fontStyle: 'italic' },
});