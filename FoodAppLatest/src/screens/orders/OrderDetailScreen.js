import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    TextInput,
    Alert,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { useOrderStore } from '../../store/orderStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { submitReview, getOrderReview } from '../../services/review/reviewService';
import { useCartStore } from '../../store/cartStore';


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

                    // ✅ Stop polling once reply arrives
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

        // ✅ Poll every 30s only when review submitted but no reply yet
        // Will be cleared when reply arrives or component unmounts
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
            // In ReviewCard handleSubmit — pass restaurantId from order
            await submitReview(orderId, {
                rating: selected,
                comment: comment.trim() || undefined,
                restaurantId,   // ✅ forwarded from prop
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
        return (
            <View style={rvStyles.card}>
                <ActivityIndicator color={Colors.primary} />
            </View>
        );
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
                        <Icon
                            key={s}
                            name={s <= existingReview.rating ? 'star' : 'star-border'}
                            size={22}
                            color={s <= existingReview.rating ? '#F39C12' : Colors.border}
                        />
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
                        <Icon
                            name={star <= selected ? 'star' : 'star-border'}
                            size={40}
                            color={star <= selected ? '#F39C12' : Colors.border}
                        />
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
                {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <>
                        <Icon name="send" size={18} color="#fff" />
                        <Text style={rvStyles.submitText}>Submit Review</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// ORDER TIMELINE
// ─────────────────────────────────────────────────────────────────────────────
const OrderTimeline = ({ status, orderStatus }) => {
    const isCancelled = status === 'Cancelled';
    const PROGRESS_STEPS = ['Placed', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered'];

    if (isCancelled) {
        // Only show steps up to where order got + Cancelled
        // Since we only know it was cancelled, show Placed + Cancelled
        const reachedSteps = ['Placed', 'Cancelled'];
        return (
            <View style={styles.timelineContainer}>
                {reachedSteps.map((step, index) => {
                    const isCancelledStep = step === 'Cancelled';
                    return (
                        <View key={step} style={styles.timelineRow}>
                            <View style={[
                                styles.timelineCircle,
                                !isCancelledStep && styles.timelineCircleActive,
                                isCancelledStep && { backgroundColor: '#E53935' },
                            ]} />
                            {index !== reachedSteps.length - 1 && (
                                <View style={[styles.timelineLine, !isCancelledStep && styles.timelineLineActive]} />
                            )}
                            <Text style={[
                                styles.timelineText,
                                styles.timelineTextActive,
                                isCancelledStep && { color: '#E53935', fontWeight: '700' },
                            ]}>
                                {step}
                            </Text>
                        </View>
                    );
                })}
            </View>
        );
    }

    const currentIndex = PROGRESS_STEPS.indexOf(status);
    return (
        <View style={styles.timelineContainer}>
            {PROGRESS_STEPS.map((step, index) => {
                const done = index <= currentIndex;
                return (
                    <View key={step} style={styles.timelineRow}>
                        <View style={[styles.timelineCircle, done && styles.timelineCircleActive]} />
                        {index !== PROGRESS_STEPS.length - 1 && (
                            <View style={[styles.timelineLine, done && styles.timelineLineActive]} />
                        )}
                        <Text style={[styles.timelineText, done && styles.timelineTextActive]}>
                            {step}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export const OrderDetailScreen = ({ route, navigation }) => {
    const { orderId } = route.params;
    const [isReordering, setIsReordering] = useState(false);

    useEffect(() => {
        if (!orderId) return;
        // ✅ Only fetch if not already in store — prevents API call on every mount
        const existing = useOrderStore.getState().orders.find(o => o.id === orderId);
        if (!existing) {
            useOrderStore.getState().fetchOrderById(orderId);
        }
    }, [orderId]);

    const order = useOrderStore(state => state.orders.find(o => o.id === orderId));

    // ─── Reorder Handler ──────────────────────────────────────────────────────
    const handleReorder = useCallback(() => {
        if (!order) return;

        const items = order.items ?? [];
        // ✅ support both camelCase (from useOrders hook) and snake_case (from orderStore)
        const rid = order.restaurantId ?? order.restaurant_id;
        const rName = order.restaurantName ?? order.restaurant_name ?? 'Restaurant';

        if (!items.length) {
            Alert.alert('Cannot Reorder', 'No items found in this order.');
            return;
        }
        if (!rid) {
            Alert.alert('Cannot Reorder', 'Restaurant information is missing.');
            return;
        }

        const cartStore = useCartStore.getState();
        const cartHasConflict =
            cartStore.items.length > 0 && cartStore.restaurantId !== rid;

        const doAdd = () => {
            setIsReordering(true);
            try {
                cartStore.clearCart();

                items.forEach((item) => {
                    const dish = {
                        id: item.menu_item_id ?? item.id,
                        name: item.item_name ?? item.name,          // ← was item_name_snapshot ❌
                        base_price: item.unit_price ?? item.price ?? 0,   // ← was unit_price_snapshot ❌
                        price: item.unit_price ?? item.price ?? 0,
                        image_url: item.image ?? null,
                        dietary_tag: item.dietary_tag ?? null,
                    };
                    const qty = item.quantity ?? 1;
                    // First call creates the entry; subsequent calls increment quantity
                    cartStore.addItem(dish, rid, rName);
                    for (let i = 1; i < qty; i++) {
                        cartStore.addItem(dish, rid, rName);
                    }
                });

                // ✅ CartScreen is in the root stack — navigate directly
                navigation.navigate('CartScreen');
            } catch (e) {
                Alert.alert('Error', 'Failed to add items to cart. Please try again.');
                console.error('Reorder error:', e);
            } finally {
                setIsReordering(false);
            }
        };

        if (cartHasConflict) {
            Alert.alert(
                'Replace Cart?',
                `Your cart has items from "${cartStore.restaurantName}". Replace with items from "${rName}"?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Yes, Replace', style: 'destructive', onPress: doAdd },
                ]
            );
        } else {
            doAdd();
        }
    }, [order, navigation]);

    if (!order) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
            </SafeAreaView>
        );
    }

    // Replace STATUS_MAP_LOCAL inside the component
    const STATUS_MAP_LOCAL = {
        // snake_case (socket)
        placed: 'Placed', confirmed: 'Confirmed', preparing: 'Preparing',
        ready_for_pickup: 'Ready for Pickup', out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered', completed: 'Delivered',
        cancelled: 'Cancelled', refunded: 'Refunded',
        // PascalCase (API response)
        Placed: 'Placed', Confirmed: 'Confirmed', Preparing: 'Preparing',
        ReadyForPickup: 'Ready for Pickup', OutForDelivery: 'Out for Delivery',
        Delivered: 'Delivered', Completed: 'Delivered',
        Cancelled: 'Cancelled', Refunded: 'Refunded',
    };
    const displayStatus = STATUS_MAP_LOCAL[order.order_status] || order.status || order.order_status || 'Placed';
    const isCompleted = displayStatus === 'Delivered' || order.order_status === 'completed';

    const STATUS_COLORS = {
        Placed: { color: '#3498DB', bg: '#EBF5FB' },
        Confirmed: { color: '#9B59B6', bg: '#F5EEF8' },
        Preparing: { color: '#E67E22', bg: '#FEF9E7' },
        'Ready for Pickup': { color: '#F39C12', bg: '#FEF9E7' },
        'Out for Delivery': { color: Colors.primary, bg: Colors.primaryLight },
        Delivered: { color: Colors.success, bg: '#EAFAF1' },
        Cancelled: { color: '#E53935', bg: '#FDEDEC' },  // ← add this
    };
    const badgeStyle = STATUS_COLORS[displayStatus] ?? STATUS_COLORS.Placed;

    const formattedDate = new Date(
        order.placed_at || order.createdAt || order.created_at
    ).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back-ios" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Details</Text>
                <View style={{ width: 20 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Restaurant Info */}
                <View style={styles.restaurantBox}>
                    <View style={styles.restaurantRow}>
                        <View style={styles.restaurantIcon}>
                            <Icon name="restaurant" size={22} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.restaurantName}>
                                {order.restaurantName && order.restaurantName !== 'Restaurant'
                                    ? order.restaurantName
                                    : order.restaurant_name || 'Restaurant'}
                            </Text>
                            <Text style={styles.orderDate}>{formattedDate}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg }]}>
                            <Text style={[styles.statusText, { color: badgeStyle.color }]}>
                                {displayStatus}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Timeline */}
                <Text style={styles.sectionTitle}>Order Status</Text>
                <OrderTimeline status={displayStatus} orderStatus={order.order_status} />

                {/* Items */}
                <Text style={styles.sectionTitle}>Items</Text>
                {(order.items ?? []).map((item, index) => (
                    <View key={item.id || item.menu_item_id || index}>
                        <View style={styles.itemRow}>
                            <View style={styles.itemLeft}>
                                <View style={styles.vegDot} />
                                <Text style={styles.itemName}>
                                    {/* ✅ OrderItemDto.ItemName → item_name */}
                                    {item.quantity} × {item.item_name ?? item.name}
                                </Text>
                            </View>
                            <Text style={styles.itemPrice}>
                                {/* ✅ OrderItemDto.UnitPrice → unit_price */}
                                {formatCurrency((item.unit_price ?? item.price ?? 0) * (item.quantity || 1))}
                            </Text>
                        </View>
                        {index < (order.items.length - 1) && <View style={styles.divider} />}
                    </View>
                ))}

                {/* Bill Details */}
                <View style={styles.totalBox}>
                    <Text style={styles.sectionTitle}>Bill Details</Text>
                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Subtotal</Text>
                        <Text style={styles.billValue}>{formatCurrency(parseFloat(order.subtotal_amount || 0))}</Text>
                    </View>
                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Delivery Fee</Text>
                        <Text style={styles.billValue}>{formatCurrency(parseFloat(order.delivery_fee || 0))}</Text>
                    </View>
                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Taxes</Text>
                        <Text style={styles.billValue}>{formatCurrency(parseFloat(order.tax_amount || 0))}</Text>
                    </View>
                    {parseFloat(order.discount_amount) > 0 && (
                        <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Discount</Text>
                            <Text style={[styles.billValue, { color: Colors.success }]}>
                                − {formatCurrency(parseFloat(order.discount_amount))}
                            </Text>
                        </View>
                    )}
                    <View style={styles.divider} />
                    <View style={styles.billRow}>
                        <Text style={styles.totalLabel}>Total Paid</Text>
                        <Text style={styles.totalAmount}>
                            {formatCurrency(parseFloat(order.total_amount || order.total || 0))}
                        </Text>
                    </View>
                </View>

                {/* Cancel Reason */}
                {displayStatus === 'Cancelled' && !!(order.cancel_reason) && (
                    <View style={styles.totalBox}>
                        <Text style={[styles.sectionTitle, { paddingHorizontal: 0, paddingTop: 0 }]}>
                            Cancellation Reason
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
                            <Icon name="info-outline" size={16} color="#E53935" />
                            <Text style={{ flex: 1, fontSize: 13, color: '#E53935', lineHeight: 20 }}>
                                {String(order.cancel_reason)}
                            </Text>
                        </View>
                    </View>
                )}
                {/* Review Card — only for completed orders */}
                {isCompleted && (
                    <>
                        <Text style={styles.sectionTitle}>Your Review</Text>
                        <ReviewCard
                            orderId={String(order.id)}
                            restaurantId={order.restaurant_id}   // ✅ add this prop
                        />
                    </>
                )}

                {/* ✅ Reorder Button — fully wired */}
                <TouchableOpacity
                    style={[styles.reorderBtn, isReordering && { opacity: 0.6 }]}
                    onPress={handleReorder}
                    disabled={isReordering}
                    activeOpacity={0.85}
                >
                    {isReordering ? (
                        <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                        <>
                            <Icon name="replay" size={18} color={Colors.white} style={{ marginRight: 8 }} />
                            <Text style={styles.reorderText}>Reorder</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, backgroundColor: Colors.white,
        borderBottomWidth: 1, borderColor: Colors.border,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
    restaurantBox: { backgroundColor: Colors.white, padding: 16, marginTop: 8 },
    restaurantRow: { flexDirection: 'row', alignItems: 'center' },
    restaurantIcon: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    restaurantName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
    orderDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
    statusBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: '700', color: Colors.success },
    sectionTitle: {
        fontSize: 16, fontWeight: '700',
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
        color: Colors.textPrimary,
    },
    itemRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 16,
        backgroundColor: Colors.white, borderRadius: 10,
        marginHorizontal: 16, marginBottom: 10,
        elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3,
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    vegDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },
    itemName: { fontSize: 14, color: Colors.textPrimary },
    itemPrice: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    divider: { height: 1, backgroundColor: Colors.border },
    totalBox: {
        margin: 16, padding: 16,
        backgroundColor: Colors.white, borderRadius: 12,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    },
    billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    billLabel: { fontSize: 13, color: Colors.textSecondary },
    billValue: { fontSize: 13, color: Colors.textPrimary },
    totalLabel: { fontSize: 14, color: Colors.textSecondary },
    totalAmount: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },
    reorderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 16,
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
    },
    reorderText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
    timelineContainer: { paddingHorizontal: 16, paddingTop: 6 },
    timelineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    timelineCircle: {
        width: 14, height: 14, borderRadius: 7,
        backgroundColor: Colors.border, marginRight: 10,
    },
    timelineCircleActive: { backgroundColor: Colors.success },
    timelineLine: {
        position: 'absolute', left: 6, top: 14,
        width: 2, height: 30, backgroundColor: Colors.border,
    },
    timelineLineActive: { backgroundColor: Colors.success },
    timelineText: { fontSize: 13, color: Colors.textLight },
    timelineTextActive: { color: Colors.textPrimary, fontWeight: '600' },
});

const rvStyles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: 18,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        alignItems: 'center',
        gap: 10,
    },
    title: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
    sub: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
    starsRow: { flexDirection: 'row', gap: 6, marginVertical: 4 },
    starsRowSmall: { flexDirection: 'row', gap: 3 },
    starLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    commentInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 12,
        fontSize: 13,
        color: Colors.textPrimary,
        minHeight: 80,
    },
    charCount: { alignSelf: 'flex-end', fontSize: 11, color: Colors.textLight },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 13,
        paddingHorizontal: 28,
        borderRadius: 14,
        marginTop: 4,
    },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    thankRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    thankEmoji: { fontSize: 28 },
    thankTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
    thankSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
    savedComment: {
        fontSize: 13, color: Colors.textSecondary,
        fontStyle: 'italic', textAlign: 'center',
    },
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