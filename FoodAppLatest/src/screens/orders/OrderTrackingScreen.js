import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  StatusBar, Platform, Alert,
  KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { useOrderStore } from '../../store/orderStore';
import { cancelOrder as cancelOrderAPI } from '../../services/order/orderService';

// ─── Status Maps ──────────────────────────────────────────────────────────────
const STATUS_MAP = {
  // snake_case from socket
  placed: 'Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  // PascalCase from .NET SignalR events
  Placed: 'Placed',
  Confirmed: 'Confirmed',
  Preparing: 'Preparing',
  ReadyForPickup: 'Ready for Pickup',
  OutForDelivery: 'Out for Delivery',
  Delivered: 'Delivered',
  Completed: 'Delivered',
  Cancelled: 'Cancelled',
  Refunded: 'Refunded',
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
    color: '#FC8019',
  },
  {
    key: 'Delivered',
    icon: 'check-circle', emoji: '🎉',
    label: 'Delivered!', sub: 'Enjoy your meal',
    color: '#27AE60',
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
// RIDER ANIMATION
// ─────────────────────────────────────────────────────────────────────────────
const RiderAnimation = ({ isActive, s }) => {
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
      <Animated.View style={[s.riderBox, { transform: [{ translateY: bounceAnim }, { scale: scaleAnim }] }]}>
      <Text style={s.riderEmoji}>🛵</Text>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE STEP
// ─────────────────────────────────────────────────────────────────────────────
const TimelineStep = ({ config, isDone, isActive, isLast, C, s }) => {
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
    <View style={s.timelineStep}>
      <View style={s.timelineLeft}>
        <Animated.View style={[
          s.timelineDot,
          isDone && { backgroundColor: config.color, borderColor: config.color },
          isActive && { backgroundColor: C.surface, borderColor: config.color, borderWidth: 3 },
          { transform: [{ scale: scaleAnim }] },
        ]}>
          {isDone ? <Icon name="check" size={12} color={C.white} /> :
            isActive ? <View style={[s.activeDotInner, { backgroundColor: config.color }]} /> : null}
        </Animated.View>
        {!isLast && (
          <View style={s.timelineLineTrack}>
            <Animated.View style={[s.timelineLineFill, { height: lineHeight, backgroundColor: config.color }]} />
          </View>
        )}
      </View>
      <Animated.View style={[s.timelineContent, { opacity: opacityAnim }]}>
        <View style={s.timelineTextRow}>
          <Text style={[
            s.timelineLabel,
            (isDone || isActive) && s.timelineLabelActive,
            isActive && { color: config.color },
          ]}>
            {config.label}
          </Text>
          {isActive && (
            <View style={[s.activeBadge, { backgroundColor: config.color + '22' }]}>
              <View style={[s.activeDot, { backgroundColor: config.color }]} />
              <Text style={[s.activeBadgeText, { color: config.color }]}>Now</Text>
            </View>
          )}
        </View>
        <Text style={s.timelineSub}>{config.sub}</Text>
      </Animated.View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ETA CIRCLE
// ─────────────────────────────────────────────────────────────────────────────
const ETACircle = ({ minutes, status, C, s }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);

  if (status === 'Cancelled') {
    return (
      <View style={[s.etaCircle, { backgroundColor: Colors.error }]}>
        <Text style={s.etaEmoji}>❌</Text>
        <Text style={s.etaDeliveredText}>Cancelled</Text>
      </View>
    );
  }

  if (status === 'Delivered') {
    return (
      <View style={[s.etaCircle, { backgroundColor: C.success }]}>
        <Text style={s.etaEmoji}>🎉</Text>
        <Text style={s.etaDeliveredText}>Delivered!</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[s.etaCircle, { transform: [{ scale: pulseAnim }] }]}>
      <Text style={s.etaMins}>{minutes}</Text>
      <Text style={s.etaLabel}>min</Text>
      <Text style={s.etaSub}>estimated</Text>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN — all hooks at top level (Rules of Hooks compliant)
// ─────────────────────────────────────────────────────────────────────────────
export const OrderTrackingScreen = ({ navigation, route }) => {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { orderId } = route.params;

  // ── Animation refs — declared unconditionally at the top ─────────────────
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(30)).current;

  // ── Store selector ────────────────────────────────────────────────────────
  const currentOrder = useOrderStore(state =>
    state.orders.find(o => String(o.id) === String(orderId) || o.order_code === orderId)
  );

  // ── Entrance animation ────────────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Fetch fresh order data on mount ──────────────────────────────────────
  useEffect(() => {
    const existing = useOrderStore.getState().orders
      .find(o => String(o.id) === String(orderId));

    // Order was just placed — store has fresh data, skip the fetch
    // Only fetch if order is NOT in store (e.g. deep link, app restart)
    if (!existing) {
      useOrderStore.getState().fetchOrderById(orderId);
    }
  }, [orderId]);

  // ── Derive display values ─────────────────────────────────────────────────
  const rawStatus = currentOrder?.order_status ?? '';
  const currentStatus =
    STATUS_MAP[rawStatus] ??
    STATUS_MAP[rawStatus?.toLowerCase()] ??
    rawStatus ??
    'Placed';

  const isDelivered = currentStatus === 'Delivered';
  const timelineSteps = STATUS_CONFIG.filter(s => s.key !== 'Cancelled');
  const currentIdx = Math.max(0, timelineSteps.findIndex(s => s.key === currentStatus));
  const eta = currentStatus === 'Cancelled' ? 0 : (ETA_BY_STATUS[currentStatus] ?? 0);
  const activeConfig = STATUS_CONFIG.find(s => s.key === currentStatus) ?? STATUS_CONFIG[0];

  // ── Cancel handler ────────────────────────────────────────────────────────
  const handleCancelOrder = useCallback(() => {
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
          }
        },
      },
    ]);
  }, [orderId]);

  // ── Navigate to ReviewScreen ──────────────────────────────────────────────
  const handleReviewNavigate = useCallback(() => {
    if (!currentOrder) return;
    // Extract first item's menu_item_id so the review row in DB is populated
    const firstItem = (currentOrder.items ?? [])[0];
    const menuItemId = firstItem?.menu_item_id ?? firstItem?.id ?? null;

    navigation.navigate('ReviewScreen', {
      orderId: String(currentOrder.id ?? currentOrder.order_code),
      restaurantId: currentOrder.restaurant_id,
      restaurantName: currentOrder.restaurantName || currentOrder.restaurant_name || 'Restaurant',
      orderCode: currentOrder.order_code ?? currentOrder.id,
      menuItemId,
      fromScreen: 'tracking',
    });
  }, [currentOrder, navigation]);

  // ── No order guard ────────────────────────────────────────────────────────
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
        <ETACircle minutes={eta} status={currentStatus} C={Colors} s={styles} />
        <Text style={styles.headerStatus}>{activeConfig.label}</Text>
        <Text style={styles.headerSub}>{activeConfig.sub}</Text>
        <View style={styles.orderIdRow}>
          <Icon name="tag" size={13} color="rgba(255,255,255,0.7)" />
          <Text style={styles.orderId}>Order #{order.order_code ?? order.id}</Text>
        </View>
        {currentStatus === 'Out for Delivery' && <RiderAnimation isActive s={styles} />}
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
                  C={Colors} s={styles}
                />
              ))}
            {currentStatus === 'Cancelled' && (
              <>
                {timelineSteps.slice(0, currentIdx + 1).map((config) => (
                  <TimelineStep key={config.key} config={config} isDone isActive={false} isLast={false} C={Colors} s={styles} />
                ))}
                <TimelineStep
                  config={STATUS_CONFIG.find(s => s.key === 'Cancelled')}
                  isDone={false} isActive isLast
                  C={Colors} s={styles}
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

        {/* Review — Navigate to ReviewScreen instead of inline ReviewCard */}
        {isDelivered && (
          <TouchableOpacity
            style={styles.reviewNavCard}
            onPress={handleReviewNavigate}
            activeOpacity={0.8}
          >
            <View style={styles.reviewNavLeft}>
              <View style={styles.reviewNavIconBox}>
                <Icon name="star" size={24} color={Colors.warning} />
              </View>
              <View style={styles.reviewNavText}>
                <Text style={styles.reviewNavTitle}>Rate Your Order</Text>
                <Text style={styles.reviewNavSub}>
                  Share your experience with {order.restaurantName || order.restaurant_name || 'the restaurant'}
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={24} color={Colors.textLight} />
          </TouchableOpacity>
        )}

        {/* Cancel Reason */}
        {currentStatus === 'Cancelled' && !!(order.cancel_reason) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cancellation Reason</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <Icon name="info-outline" size={18} color={Colors.error} />
              <Text style={{ flex: 1, fontSize: 14, color: Colors.error, lineHeight: 20 }}>
                {String(order.cancel_reason)}
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsCard}>
          {!isDelivered && (currentStatus === 'Placed' || currentStatus === 'Confirmed') && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOrder}>
              <Icon name="cancel" size={20} color={Colors.white} />
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
const createStyles = (C) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  container: { flex: 1, backgroundColor: C.surface },

  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.error, paddingVertical: 14, borderRadius: 14,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: C.white },

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
  headerStatus: { fontSize: 22, fontWeight: '800', color: C.white, marginTop: 12, marginBottom: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderId: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  etaCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  etaMins: { fontSize: 28, fontWeight: '900', color: C.white, lineHeight: 32 },
  etaLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  etaSub: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  etaEmoji: { fontSize: 32 },
  etaDeliveredText: { fontSize: 13, fontWeight: '800', color: C.white },

  riderBox: {
    position: 'absolute', bottom: -18, right: 32,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.surface,
    justifyContent: 'center', alignItems: 'center', elevation: 6,
  },
  riderEmoji: { fontSize: 26 },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 40, gap: 12 },

  card: {
    backgroundColor: C.surface, borderRadius: 18, padding: 18,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: C.textPrimary, marginBottom: 16 },

  timeline: { gap: 0 },

  timelineStep: { flexDirection: 'row', gap: 14, minHeight: 64 },
  timelineLeft: { alignItems: 'center', width: 28 },
  timelineDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.border, borderWidth: 2, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  activeDotInner: { width: 10, height: 10, borderRadius: 5 },
  timelineLineTrack: { width: 2, flex: 1, backgroundColor: C.border, marginTop: 2, overflow: 'hidden' },
  timelineLineFill: { width: '100%', borderRadius: 1 },
  timelineContent: { flex: 1, paddingBottom: 20, paddingTop: 2 },
  timelineTextRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  timelineLabel: { fontSize: 14, fontWeight: '600', color: C.textLight },
  timelineLabelActive: { color: C.textPrimary, fontWeight: '700' },
  timelineSub: { fontSize: 12, color: C.textLight },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeBadgeText: { fontSize: 10, fontWeight: '700' },

  summaryRestRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  summaryRestName: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  summaryItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, gap: 8,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  summaryItemName: { flex: 1, fontSize: 13, color: C.textSecondary },
  summaryItemQty: { fontSize: 13, color: C.textSecondary, width: 28, textAlign: 'center' },
  summaryItemPrice: { fontSize: 13, fontWeight: '600', color: C.textPrimary, width: 64, textAlign: 'right' },
  summaryDivider: { height: 1, backgroundColor: C.divider, marginVertical: 10 },
  summaryBillRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  summaryBillLabel: { fontSize: 13, color: C.textSecondary },
  summaryBillValue: { fontSize: 13, color: C.textPrimary, fontWeight: '500' },
  summaryDiscount: { color: C.success, fontWeight: '600' },
  summaryTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  summaryTotalLabel: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  summaryTotalValue: { fontSize: 16, fontWeight: '900', color: C.primary },
  summaryPaymentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-end',
    backgroundColor: C.primaryLight,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginTop: 10,
  },
  summaryPaymentText: { fontSize: 11, fontWeight: '700', color: C.primary },

  deliveryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  deliveryText: { flex: 1 },
  deliveryLabel: { fontSize: 12, color: C.textLight, marginBottom: 2 },
  deliveryValue: { fontSize: 14, fontWeight: '600', color: C.textPrimary },

  // ── Review navigation card (replaces inline ReviewCard) ──
  reviewNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  reviewNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  reviewNavIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: C.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewNavText: { flex: 1, gap: 2 },
  reviewNavTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  reviewNavSub: { fontSize: 12, color: C.textSecondary },

  actionsCard: { gap: 10, paddingBottom: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.surface,
    paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.primary, elevation: 2,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: C.primary },
  reorderBtn: { marginBottom: 0 },
  homeBtn: { backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },

  noOrderBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  noOrderEmoji: { fontSize: 64 },
  noOrderTitle: { fontSize: 18, color: C.textSecondary, fontWeight: '600' },
});