import api from "../../services/api/base";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  StatusBar, Platform, Alert, TextInput,
  KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { useOrderStore } from '../../store/orderStore';
import { socket } from '../../services/socket/socket';
import { submitReview, getOrderReview } from '../../services/review/reviewService';
import { cancelOrder as cancelOrderAPI } from '../../services/order/orderService';

// ─── Status Maps ──────────────────────────────────────────────────────────────
const STATUS_MAP = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const STATUS_CONFIG = [
  {
    key: 'Placed',
    icon: 'receipt-long', emoji: '📋',
    label: 'Order Placed', sub: 'Your order has been received',
    color: '#3498DB',
  },
  {
    key: 'Confirmed',
    icon: 'check-circle', emoji: '✅',
    label: 'Order Confirmed', sub: 'Restaurant confirmed your order',
    color: '#9B59B6',
  },
  {
    key: 'Preparing',
    icon: 'restaurant', emoji: '👨‍🍳',
    label: 'Preparing', sub: 'Chef is cooking your food',
    color: '#E67E22',
  },
  {
    key: 'Ready for Pickup',
    icon: 'hourglass-empty', emoji: '⏳',
    label: 'Ready for Pickup', sub: 'Your order is ready and waiting for pickup',
    color: '#F39C12',
  },
  {
    key: 'Out for Delivery',
    icon: 'delivery-dining', emoji: '🛵',
    label: 'Out for Delivery', sub: 'Rider is on the way to you',
    color: Colors.primary,
  },
  {
    key: 'Delivered',
    icon: 'check-circle', emoji: '🎉',
    label: 'Delivered!', sub: 'Enjoy your meal',
    color: Colors.success,
  },
  {
    key: 'Cancelled',
    icon: 'cancel', emoji: '❌',
    label: 'Order Cancelled', sub: 'Your order has been cancelled',
    color: '#E53935',
  },
];

const ETA_BY_STATUS = {
  Placed: 35, Confirmed: 30, Preparing: 20,
  'Ready for Pickup': 10, 'Out for Delivery': 5, Delivered: 0,
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

          // ✅ Stop polling once reply arrives
          if (review.reply_text && pollInterval) {
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
      await submitReview(orderId, {
        rating: selected,
        comment: comment.trim() || undefined,
        restaurantId: restaurantId,
      });
      setSubmitted(true);
    } catch (err) {
      const msg = err?.response?.data?.error?.message ?? 'Failed to submit review. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  }, [orderId, selected, comment, restaurantId]);

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
        {existingReview.reply_text ? (
          <View style={rvStyles.replyBox}>
            <Icon name="store" size={14} color={Colors.primary} />
            <Text style={rvStyles.replyText}>{existingReview.reply_text}</Text>
          </View>
        ) : (
          <Text style={rvStyles.awaitingReply}>Awaiting vendor reply…</Text>
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
// RIDER ANIMATION
// ─────────────────────────────────────────────────────────────────────────────
const RiderAnimation = ({ isActive }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) return;
    Animated.loop(Animated.sequence([
      Animated.timing(bounceAnim, { toValue: -8, duration: 400, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ])).start();
  }, [isActive]);

  return (
    <Animated.View style={[styles.riderBox, { transform: [{ translateY: bounceAnim }, { scale: scaleAnim }] }]}>
      <Text style={styles.riderEmoji}>🛵</Text>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE STEP
// ─────────────────────────────────────────────────────────────────────────────
const TimelineStep = ({ config, isDone, isActive, isLast }) => {
  const scaleAnim = useRef(new Animated.Value(isDone || isActive ? 1 : 0.8)).current;
  const opacityAnim = useRef(new Animated.Value(isDone || isActive ? 1 : 0.4)).current;
  const lineAnim = useRef(new Animated.Value(isDone ? 1 : 0)).current;

  useEffect(() => {
    if (isDone || isActive) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
    if (isDone) {
      Animated.timing(lineAnim, { toValue: 1, duration: 600, useNativeDriver: false }).start();
    }
  }, [isDone, isActive]);

  const lineHeight = lineAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.timelineStep}>
      <View style={styles.timelineLeft}>
        <Animated.View style={[
          styles.timelineDot,
          isDone && { backgroundColor: config.color, borderColor: config.color },
          isActive && { backgroundColor: Colors.white, borderColor: config.color, borderWidth: 3 },
          { transform: [{ scale: scaleAnim }] },
        ]}>
          {isDone ? <Icon name="check" size={12} color={Colors.white} /> :
            isActive ? <View style={[styles.activeDotInner, { backgroundColor: config.color }]} /> : null}
        </Animated.View>
        {!isLast && (
          <View style={styles.timelineLineTrack}>
            <Animated.View style={[styles.timelineLineFill, { height: lineHeight, backgroundColor: config.color }]} />
          </View>
        )}
      </View>
      <Animated.View style={[styles.timelineContent, { opacity: opacityAnim }]}>
        <View style={styles.timelineTextRow}>
          <Text style={[
            styles.timelineLabel,
            (isDone || isActive) && styles.timelineLabelActive,
            isActive && { color: config.color },
          ]}>
            {config.label}
          </Text>
          {isActive && (
            <View style={[styles.activeBadge, { backgroundColor: config.color + '22' }]}>
              <View style={[styles.activeDot, { backgroundColor: config.color }]} />
              <Text style={[styles.activeBadgeText, { color: config.color }]}>Now</Text>
            </View>
          )}
        </View>
        <Text style={styles.timelineSub}>{config.sub}</Text>
      </Animated.View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ETA CIRCLE
// ─────────────────────────────────────────────────────────────────────────────
const ETACircle = ({ minutes, status }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);

  if (status === 'Cancelled') {
    return (
      <View style={[styles.etaCircle, { backgroundColor: '#E53935' }]}>
        <Text style={styles.etaEmoji}>❌</Text>
        <Text style={styles.etaDeliveredText}>Cancelled</Text>
      </View>
    );
  }

  if (status === 'Delivered') {
    return (
      <View style={[styles.etaCircle, { backgroundColor: Colors.success }]}>
        <Text style={styles.etaEmoji}>🎉</Text>
        <Text style={styles.etaDeliveredText}>Delivered!</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.etaCircle, { transform: [{ scale: pulseAnim }] }]}>
      <Text style={styles.etaMins}>{minutes}</Text>
      <Text style={styles.etaLabel}>min</Text>
      <Text style={styles.etaSub}>estimated</Text>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export const OrderTrackingScreen = ({ navigation, route }) => {
  const { orderId } = route.params;

  const currentOrder = useOrderStore(state =>
    state.orders.find(o => o.id === orderId || o.order_code === orderId)
  );

  useEffect(() => {
    if (!orderId) return;
    socket.emit('joinOrderRoom', orderId);
    return () => socket.emit('leaveOrderRoom', orderId);
  }, [orderId]);

  useEffect(() => {
    if (orderId) useOrderStore.getState().fetchOrderById(orderId);
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const handleStatusUpdate = (data) => {
      if (data.orderId === orderId) {
        useOrderStore.getState().setOrderStatus(data.orderId, data.status);
      }
    };
    socket.on('orderStatusUpdated', handleStatusUpdate);
    return () => socket.off('orderStatusUpdated', handleStatusUpdate);
  }, [orderId]);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const rawStatus = currentOrder?.order_status ?? '';
  const currentStatus = currentOrder?.status
    ?? STATUS_MAP[rawStatus?.toLowerCase()]
    ?? rawStatus;

  // ADD THIS
  console.log("🔄 status debug:", { rawStatus, currentStatus, order_status: currentOrder?.order_status });

  const isDelivered = currentStatus === 'Delivered';
  const timelineSteps = STATUS_CONFIG.filter(s => s.key !== 'Cancelled');
  const currentIdx = Math.max(0, timelineSteps.findIndex(s => s.key === currentStatus));
  const eta = currentStatus === 'Cancelled' ? 0 : (ETA_BY_STATUS[currentStatus] ?? 0);
  const activeConfig = STATUS_CONFIG.find(s => s.key === currentStatus) ?? STATUS_CONFIG[0];

  const handleCancelOrder = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes', style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrderAPI(orderId, 'Customer requested cancellation');
            useOrderStore.getState().setOrderStatus(orderId, 'cancelled');
          } catch (e) {
            Alert.alert('Error', 'Could not cancel order. Please try again.');
            console.log('Cancel error', e);
          }
        },
      },
    ]);
  };

  if (!currentOrder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noOrderBox}>
          <Text style={styles.noOrderEmoji}>📦</Text>
          <Text style={styles.noOrderTitle}>No active order</Text>
          <Button
            title="Go to Home"
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] })}
          />
        </View>
      </SafeAreaView>
    );
  }

  const order = currentOrder;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar backgroundColor={activeConfig.color} barStyle="light-content" />

      {/* Header */}
      <Animated.View style={[styles.header, { backgroundColor: activeConfig.color, opacity: headerAnim }]}>
        <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-ios" size={20} color={Colors.white} />
        </TouchableOpacity>
        <ETACircle minutes={eta} status={currentStatus} />
        <Text style={styles.headerStatus}>{activeConfig.label}</Text>
        <Text style={styles.headerSub}>{activeConfig.sub}</Text>
        <View style={styles.orderIdRow}>
          <Icon name="tag" size={13} color="rgba(255,255,255,0.7)" />
          <Text style={styles.orderId}>Order #{order.order_code ?? order.id}</Text>
        </View>
        {currentStatus === 'Out for Delivery' && <RiderAnimation isActive />}
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Timeline</Text>
          <View style={styles.timeline}>
            {currentStatus !== 'Cancelled' &&
              timelineSteps.map((config, idx) => (
                <TimelineStep
                  key={config.key}
                  config={config}
                  isDone={idx < currentIdx}
                  isActive={idx === currentIdx}
                  isLast={idx === timelineSteps.length - 1}
                />
              ))}
            {currentStatus === 'Cancelled' && (
              <>
                {timelineSteps.slice(0, currentIdx + 1).map((config) => (
                  <TimelineStep key={config.key} config={config} isDone isActive={false} isLast={false} />
                ))}
                <TimelineStep
                  config={STATUS_CONFIG.find(s => s.key === 'Cancelled')}
                  isDone={false} isActive isLast
                />
              </>
            )}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.summaryRestRow}>
            <Icon name="restaurant" size={16} color={Colors.primary} />
            <Text style={styles.summaryRestName}>
              {String(order.restaurantName || order.restaurant_name || 'Restaurant')}
            </Text>
          </View>

          {(order.items ?? []).map((item) => (
            <View key={item.id ?? item.menu_item_id} style={styles.summaryItem}>
              <Text style={styles.summaryItemName} numberOfLines={1}>
                {String(item.item_name ?? item.name ?? '')}
              </Text>
              <Text style={styles.summaryItemQty}>×{item.quantity || 1}</Text>
              <Text style={styles.summaryItemPrice}>
                {formatCurrency((Number(item.unit_price) || 0) * (Number(item.quantity) || 1))}
              </Text>
            </View>
          ))}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryBillRow}>
            <Text style={styles.summaryBillLabel}>Item Total</Text>
            <Text style={styles.summaryBillValue}>
              {formatCurrency(parseFloat(order.subtotal_amount || 0))}
            </Text>
          </View>
          <View style={styles.summaryBillRow}>
            <Text style={styles.summaryBillLabel}>Delivery Fee</Text>
            <Text style={styles.summaryBillValue}>
              {parseFloat(order.delivery_fee || 0) === 0
                ? '🎉 Free'
                : formatCurrency(parseFloat(order.delivery_fee || 0))}
            </Text>
          </View>
          {parseFloat(order.tax_amount || 0) > 0 && (
            <View style={styles.summaryBillRow}>
              <Text style={styles.summaryBillLabel}>GST & Charges</Text>
              <Text style={styles.summaryBillValue}>
                {formatCurrency(parseFloat(order.tax_amount || 0))}
              </Text>
            </View>
          )}
          {parseFloat(order.discount_amount || 0) > 0 && (
            <View style={styles.summaryBillRow}>
              <Text style={styles.summaryBillLabel}>
                Discount {order.coupon_code ? `(${order.coupon_code})` : ''}
              </Text>
              <Text style={[styles.summaryBillValue, styles.summaryDiscount]}>
                − {formatCurrency(parseFloat(order.discount_amount || 0))}
              </Text>
            </View>
          )}

          <View style={styles.summaryDivider} />
          <View style={styles.summaryTotal}>
            <Text style={styles.summaryTotalLabel}>Total Paid</Text>
            <Text style={styles.summaryTotalValue}>
              {formatCurrency(parseFloat(order.total_amount || order.total || 0))}
            </Text>
          </View>
          <View style={styles.summaryPaymentChip}>
            <Icon name="payments" size={13} color={Colors.primary} />
            <Text style={styles.summaryPaymentText}>
              {String(order.payment_method || 'cod').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Delivery Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Details</Text>
          <View style={styles.deliveryRow}>
            <Icon name="location-on" size={18} color={Colors.primary} />
            <View style={styles.deliveryText}>
              <Text style={styles.deliveryLabel}>Delivering to</Text>
              <Text style={styles.deliveryValue}>
                {order.deliveryAddress
                  ? `${order.deliveryAddress.address_line1}, ${order.deliveryAddress.city}`
                  : 'Address not available'}
              </Text>
            </View>
          </View>
          <View style={styles.deliveryRow}>
            <Icon name="payments" size={18} color={Colors.primary} />
            <View style={styles.deliveryText}>
              <Text style={styles.deliveryLabel}>Payment</Text>
              <Text style={styles.deliveryValue}>
                {String(order.payment_method || 'cod').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Review Card */}
        {isDelivered && (
          <ReviewCard
            orderId={String(order.id ?? order.order_code)}
            restaurantId={order.restaurant_id}
          />
        )}
        {/* Cancel Reason */}
        {currentStatus === 'Cancelled' && !!(order.cancel_reason) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cancellation Reason</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <Icon name="info-outline" size={18} color="#E53935" />
              <Text style={{ flex: 1, fontSize: 14, color: '#E53935', lineHeight: 20 }}>
                {String(order.cancel_reason)}
              </Text>
            </View>
          </View>
        )}
        {/* Actions */}
        <View style={styles.actionsCard}>
          {!isDelivered && (currentStatus === 'Placed' || currentStatus === 'Confirmed') && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOrder}>
              <Icon name="cancel" size={20} color="#fff" />
              <Text style={styles.cancelBtnText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
          {!isDelivered && (
            <TouchableOpacity style={styles.actionBtn}>
              <Icon name="support-agent" size={20} color={Colors.primary} />
              <Text style={styles.actionBtnText}>Contact Support</Text>
            </TouchableOpacity>
          )}
          {isDelivered && (
            <Button
              title="Order Again 🔄"
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] })}
              style={styles.reorderBtn}
            />
          )}
          <Button
            title="Back to Home"
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] })}
            style={styles.homeBtn}
          />
        </View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.white },

  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#E53935', paddingVertical: 14, borderRadius: 14,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 54,
    paddingBottom: 28, paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerBack: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 54,
    left: 16, padding: 4,
  },
  headerStatus: { fontSize: 22, fontWeight: '800', color: Colors.white, marginTop: 12, marginBottom: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderId: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  etaCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  etaMins: { fontSize: 28, fontWeight: '900', color: Colors.white, lineHeight: 32 },
  etaLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  etaSub: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  etaEmoji: { fontSize: 32 },
  etaDeliveredText: { fontSize: 13, fontWeight: '800', color: Colors.white },

  riderBox: {
    position: 'absolute', bottom: -18, right: 32,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center', elevation: 6,
  },
  riderEmoji: { fontSize: 26 },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 40, gap: 12 },

  card: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 18,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16 },

  timeline: { gap: 0 },

  timelineStep: { flexDirection: 'row', gap: 14, minHeight: 64 },
  timelineLeft: { alignItems: 'center', width: 28 },
  timelineDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.border, borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  activeDotInner: { width: 10, height: 10, borderRadius: 5 },
  timelineLineTrack: { width: 2, flex: 1, backgroundColor: Colors.border, marginTop: 2, overflow: 'hidden' },
  timelineLineFill: { width: '100%', borderRadius: 1 },
  timelineContent: { flex: 1, paddingBottom: 20, paddingTop: 2 },
  timelineTextRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  timelineLabel: { fontSize: 14, fontWeight: '600', color: Colors.textLight },
  timelineLabelActive: { color: Colors.textPrimary, fontWeight: '700' },
  timelineSub: { fontSize: 12, color: Colors.textLight },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeBadgeText: { fontSize: 10, fontWeight: '700' },

  summaryRestRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  summaryRestName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  summaryItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, gap: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  summaryItemName: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  summaryItemQty: { fontSize: 13, color: Colors.textSecondary, width: 28, textAlign: 'center' },
  summaryItemPrice: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, width: 64, textAlign: 'right' },
  summaryDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: 10 },
  summaryBillRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  summaryBillLabel: { fontSize: 13, color: Colors.textSecondary },
  summaryBillValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  summaryDiscount: { color: '#27AE60', fontWeight: '600' },
  summaryTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  summaryTotalLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  summaryTotalValue: { fontSize: 16, fontWeight: '900', color: Colors.primary },
  summaryPaymentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-end',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginTop: 10,
  },
  summaryPaymentText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  deliveryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  deliveryText: { flex: 1 },
  deliveryLabel: { fontSize: 12, color: Colors.textLight, marginBottom: 2 },
  deliveryValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  actionsCard: { gap: 10, paddingBottom: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.white,
    paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.primary, elevation: 2,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  reorderBtn: { marginBottom: 0 },
  homeBtn: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },

  noOrderBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  noOrderEmoji: { fontSize: 64 },
  noOrderTitle: { fontSize: 18, color: Colors.textSecondary, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW CARD STYLES
// ─────────────────────────────────────────────────────────────────────────────
const rvStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 20,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
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
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.primaryLight, borderRadius: 10,
    padding: 10, alignSelf: 'stretch', marginTop: 4,
  },
  replyText: { flex: 1, fontSize: 13, color: Colors.primary, fontWeight: '500' },
  awaitingReply: { fontSize: 12, color: Colors.textLight, fontStyle: 'italic', marginTop: 4 },
});