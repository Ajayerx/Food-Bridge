import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { CartItemCard } from '../../components/cards/CartItemCard';
import { Divider } from '../../components/common/Divider';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../hooks/useCart';
import { useAutoCoupon } from '../../hooks/useAutoCoupon';
import { APP_CONFIG } from '../../constants/config';
import api from '../../services/api/base';

// ─── Bill Row ─────────────────────────────────────────────
const BillRow = ({ label, value, highlight, strike, green, icon }) => (
  <View style={styles.billRow}>
    <View style={styles.billLabelRow}>
      {icon && <Icon name={icon} size={14} color={Colors.textLight} style={{ marginRight: 5 }} />}
      <Text style={[styles.billLabel, highlight && styles.billLabelBold]}>
        {label}
      </Text>
    </View>
    <Text style={[
      styles.billValue,
      highlight && styles.billValueBold,
      green && styles.billValueGreen,
      strike && styles.billValueStrike,
    ]}>
      {value}
    </Text>
  </View>
);

// ─── Auto Coupon Banner ───────────────────────────────────
const AutoCouponBanner = ({ message, visible }) => {
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -60,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      style={[
        styles.autoBanner,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
      pointerEvents="none"
    >
      <Icon name="auto-awesome" size={14} color={Colors.white} />
      <Text style={styles.autoBannerText} numberOfLines={1}>
        {message}
      </Text>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────
export const CartScreen = ({ navigation }) => {
  const {
    items,
    restaurantId,
    restaurantName,
    addItem,
    removeItem,
    clearCart,
    subtotal: frontendSubtotal,
    itemCount,
  } = useCart();

  const [backendPrices, setBackendPrices] = useState(null);
  const [loadingPrices, setLoadingPrices] = useState(false);

  // ── Auto-coupon hook ──────────────────────────────────────────────────────
  const {
    appliedCoupon,
    autoApplying,
    autoMessage,
    removeCoupon,
    overrideCoupon,
  } = useAutoCoupon(restaurantId, frontendSubtotal);

  // ── BUG 4 FIX: Timer leak on unmount ─────────────────────────────────────
  // Old code: the useEffect returned a cleanup but bannerTimerRef.current was only
  // being set INSIDE the effect body — not cleaned up if component unmounted while
  // the timer was running (e.g. user navigates away quickly after auto-apply fires).
  // The effect's own return() cleans up correctly now — no setState on dead component.
  const [showBanner, setShowBanner] = useState(false);
  const bannerTimerRef = useRef(null);

  useEffect(() => {
    if (autoMessage) {
      setShowBanner(true);
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(() => setShowBanner(false), 3500);
    }
    // Explicit cleanup: if autoMessage changes again before timer fires,
    // or if component unmounts, cancel the pending setState.
    return () => clearTimeout(bannerTimerRef.current);
  }, [autoMessage]);

  const appliedCouponCode = appliedCoupon?.code ?? null;

  // ── BUG 1 + 2 FIX: Race condition + no debounce ───────────────────────────
  // Old: every items/coupon change fired an immediate API call with no cancellation.
  // Multiple rapid taps → multiple concurrent requests → older response could land
  // AFTER a newer one, overwriting correct prices with stale data.
  //
  // Fix 1 — AbortController: each effect run creates a new controller. The cleanup
  // function calls abort() so any in-flight request from the previous run is
  // cancelled before the new one starts. The fetch checks signal.aborted before
  // calling setBackendPrices so a cancelled response never writes state.
  //
  // Fix 2 — 400ms debounce: the fetch doesn't fire until 400ms after the last
  // change. Rapid add/remove taps collapse into a single request.
  useEffect(() => {
    if (items.length === 0) {
      setBackendPrices(null);
      return;
    }

    const controller = new AbortController();
    let debounceTimer = null;

    const fetchPrices = async () => {
      setLoadingPrices(true);
      try {
        const response = await api.post(
          '/cart/calculate',
          {
            restaurant_id: restaurantId,
            items: items.map(item => ({
              menu_item_id: item.id,
              quantity: item.quantity,
            })),
            coupon_code: appliedCouponCode || null,
            order_type: 'Delivery',
            delivery_address_id: null,
          },
          { signal: controller.signal },  // ← pass abort signal to axios
        );

        // Guard: don't write state if this request was already cancelled
        if (!controller.signal.aborted && response.data.success) {
          setBackendPrices(response.data.data);
        }
      } catch (error) {
        // Ignore AbortError — it's intentional cancellation, not a real failure
        if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') return;
        console.error('Failed to fetch prices:', error?.message ?? String(error));
        // Silently fall back — don't alert, don't clear existing prices
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPrices(false);
        }
      }
    };

    // 400ms debounce: collapse rapid add/remove taps into one request
    debounceTimer = setTimeout(fetchPrices, 400);

    return () => {
      // Cleanup: cancel both the debounce timer and any in-flight request
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [items, restaurantId, appliedCouponCode]);

  // ── Bill calculations (from backend) ──────────────────────────────────────
  const subtotal = backendPrices?.sub_total ?? 0;
  const deliveryFee = backendPrices?.delivery_fee ?? 0;
  const gst = backendPrices?.tax_amount ?? 0;
  const discount = backendPrices?.discount_amount ?? 0;
  const total = backendPrices?.total_amount ?? 0;

  const isFreeDelivery = backendPrices?.is_free_delivery ?? false;
  const savings = discount;

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Remove all items from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCart },
      ],
    );
  };

  // ── BUG 3 FIX: Checkout guard ─────────────────────────────────────────────
  // Old: disabled={loadingPrices} alone. A user could tap checkout before the first
  // response lands (backendPrices === null, total === 0) or immediately after a coupon
  // change triggers a new fetch but before the debounce fires.
  //
  // Fix: block checkout when prices haven't been fetched yet (null) OR a fetch is
  // currently in-flight. Also assert total > 0 at navigation time as a last-resort guard.
  const canCheckout = !loadingPrices && backendPrices !== null && total > 0;

  const handleCheckout = () => {
    // Final assertion: should never be falsy here due to canCheckout guard,
    // but protects against any edge case where button state and data diverge.
    if (!canCheckout) {
      Alert.alert('Calculating prices', 'Please wait a moment…');
      return;
    }
    navigation.navigate('CheckoutScreen', {
      total: Math.max(total, 0),
      subtotal,
      deliveryFee,
      gst,
      discount,
      couponCode: appliedCoupon?.code,
      couponMessage: backendPrices?.coupon_message,
      items,
      restaurantId,
      restaurantName,
    });
  };

  // ── Empty State ───────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />
        <EmptyState
          emoji="🛒"
          title="Your cart is empty"
          subtitle="Add items from a restaurant to get started"
          buttonTitle="Browse Restaurants"
          onButtonPress={() => navigation.navigate('MainApp', { screen: 'HomeScreen' })}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      {/* ── Auto-apply banner (overlays header briefly) ── */}
      <AutoCouponBanner message={autoMessage} visible={showBanner} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back-ios" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* ── Restaurant + Items ── */}
        <View style={styles.section}>
          <View style={styles.sectionTopRow}>
            <View>
              <Text style={styles.restName}>{restaurantName}</Text>
              <Text style={styles.itemCountText}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
            <TouchableOpacity style={styles.clearCartBtn} onPress={handleClearCart}>
              <Icon name="delete-outline" size={16} color={Colors.error} />
              <Text style={styles.clearCartText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <Divider style={styles.itemsDivider} />
          {items?.map((item) => (
            <CartItemCard
              key={item.id}
              item={{
                dish: {
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  isVeg: item.isVeg,
                },
                quantity: item.quantity,
              }}
              onAdd={() => addItem(
                {
                  id: item.id,
                  name: item.name,
                  base_price: item.price,
                  dietary_tag: item.isVeg ? 'veg' : 'non_veg',
                  image_url: item.image,
                },
                restaurantId,
                restaurantName
              )}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </View>

        {/* ── Delivery Progress ── */}
        {!loadingPrices && backendPrices && (
          <View style={styles.section}>
            <View style={styles.deliveryProgress}>
              <View style={styles.deliveryProgressTop}>
                {backendPrices.is_free_delivery ? (
                  <Text style={styles.deliveryFreeText}>
                    🎉 You got <Text style={{ fontWeight: '800' }}>FREE delivery!</Text>
                  </Text>
                ) : (
                  <Text style={styles.deliveryProgressText}>
                    Add <Text style={styles.deliveryHighlight}>
                      ₹{backendPrices.amount_needed_for_free_delivery}
                    </Text> more for free delivery
                  </Text>
                )}
                <Text style={styles.deliveryThreshold}>
                  ₹{backendPrices.free_delivery_threshold}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, {
                  width: `${Math.min((subtotal / backendPrices.free_delivery_threshold) * 100, 100)}%`,
                  backgroundColor: backendPrices.is_free_delivery ? Colors.success : Colors.primary,
                }]} />
              </View>
            </View>
          </View>
        )}

        {/* ── Savings Corner / Coupon ── */}
        <View style={styles.section}>
          <Text style={styles.savingsCornerTitle}>SAVINGS CORNER</Text>
          {appliedCoupon ? (
            <>
              <View style={styles.couponApplied}>
                <View style={styles.couponAppliedLeft}>
                  <View style={styles.couponAppliedIcon}>
                    {autoApplying ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Icon
                        name={appliedCoupon.autoApplied ? 'auto-awesome' : 'check'}
                        size={14}
                        color={Colors.white}
                      />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.couponAppliedTopRow}>
                      <Text style={styles.couponAppliedCode}>
                        {appliedCoupon.code}
                      </Text>

                      {appliedCoupon.autoApplied && (
                        <View style={styles.autoBadge}>
                          <Text style={styles.autoBadgeText}>AUTO</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.couponAppliedLabel}>
                      You saved {formatCurrency(discount)} on this order
                    </Text>
                  </View>
                </View>

                <TouchableOpacity onPress={removeCoupon}>
                  <Icon name="close" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.changeCouponLink}
                onPress={() =>
                  navigation.navigate('CouponScreen', {
                    restaurantId,
                    cartTotal: subtotal,
                    onCouponApplied: (coupon) => overrideCoupon(coupon),
                  })
                }
              >
                <Icon name="confirmation-number" size={13} color={Colors.primary} />
                <Text style={styles.changeCouponText}>Browse all coupons</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {autoApplying ? (
                <View style={styles.couponSearching}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.couponSearchingText}>
                    Finding best offer for you…
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.couponRow}
                  onPress={() =>
                    navigation.navigate('CouponScreen', {
                      restaurantId,
                      cartTotal: subtotal,
                      onCouponApplied: (coupon) => overrideCoupon(coupon),
                    })
                  }
                >
                  <View style={styles.couponRowLeft}>
                    <View style={styles.couponIconBox}>
                      <Icon name="confirmation-number" size={18} color={Colors.white} />
                    </View>

                    <View>
                      <Text style={styles.couponRowText}>Apply Coupon</Text>
                      <Text style={styles.couponRowSub}>
                        No auto offer found — browse manually
                      </Text>
                    </View>
                  </View>

                  <Icon name="chevron-right" size={22} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
        <Divider thick />

        {/* ── Bill Details (from backend) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>

          {loadingPrices ? (
            <View style={styles.loadingBill}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingBillText}>Calculating prices...</Text>
            </View>
          ) : (
            <>
              <BillRow
                icon="receipt"
                label="Item Total"
                value={formatCurrency(subtotal)}
              />

              {/* BUG 5 FIX: Delivery fee display when free.
                  Old: value='FREE' with strike={isFreeDelivery} → showed ~~FREE~~
                  and green={isFreeDelivery} + strike={isFreeDelivery} both true.

                  Fix: when free, show TWO rows — original price struck through,
                  then 'FREE' in green without strike. When not free, show normal row.
                  This matches what Swiggy/Zomato do and is unambiguous. */}
              {isFreeDelivery ? (
                <>
                  <BillRow
                    icon="delivery-dining"
                    label="Delivery Fee"
                    value={formatCurrency(backendPrices?.delivery_fee || deliveryFee)}
                    strike
                  />
                  <BillRow
                    label=""
                    value="FREE"
                    green
                  />
                </>
              ) : (
                <BillRow
                  icon="delivery-dining"
                  label="Delivery Fee"
                  value={formatCurrency(deliveryFee)}
                />
              )}

              <BillRow
                icon="account-balance"
                label="GST & Charges"
                value={formatCurrency(gst)}
              />

              {discount > 0 && (
                <BillRow
                  icon="local-offer"
                  label={`Coupon (${appliedCoupon?.code})`}
                  value={`- ${formatCurrency(discount)}`}
                  green
                />
              )}

              <Divider style={styles.billDivider} />

              <BillRow
                label="To Pay"
                value={formatCurrency(Math.max(total, 0))}
                highlight
              />
            </>
          )}
        </View>

        {/* ── Savings ── */}
        {savings > 0 && (
          <View style={styles.savingsBar}>
            <Icon name="savings" size={16} color={Colors.success} />
            <Text style={styles.savingsText}>
              🎉 You're saving{' '}
              <Text style={styles.savingsBold}>{formatCurrency(savings)}</Text>{' '}
              on this order!
            </Text>
          </View>
        )}

        {/* ── Cancellation Policy ── */}
        <View style={styles.policyBox}>
          <Icon name="info-outline" size={14} color={Colors.textLight} />
          <Text style={styles.policyText}>
            Review your order and address before placing. Orders once placed
            cannot be cancelled after 60 seconds.
          </Text>
        </View>
      </ScrollView>

      {/* ── Footer CTA ── */}
      <View style={styles.footer}>
        <View style={styles.footerTop}>
          <Text style={styles.footerTotal}>
            {/* BUG 3 FIX: Show skeleton/zero while prices aren't ready */}
            {backendPrices ? formatCurrency(Math.max(total, 0)) : '—'}
          </Text>
          <Text style={styles.footerTotalSub}>
            {loadingPrices ? 'Calculating...' : 'total incl. taxes'}
          </Text>
        </View>
        <Button
          title="Proceed to Checkout →"
          onPress={handleCheckout}
          style={styles.checkoutBtn}
          // BUG 3 FIX: Block checkout until prices are confirmed AND valid
          disabled={!canCheckout}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // ── Auto banner ──
  autoBanner: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 999,
  },
  autoBannerText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    elevation: 2,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  scrollContent: { paddingBottom: 24 },

  // ── Section ──
  section: {
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 8,
  },
  sectionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  restName: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  itemCountText: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  clearCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearCartText: { fontSize: 12, color: Colors.error, fontWeight: '600' },
  itemsDivider: { marginBottom: 8 },

  // ── Delivery progress ──
  deliveryProgress: { gap: 8 },
  deliveryProgressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryProgressText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  deliveryHighlight: { color: Colors.primary, fontWeight: '700' },
  deliveryFreeText: { fontSize: 13, color: Colors.success, flex: 1 },
  deliveryThreshold: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },

  // ── Savings corner title ──
  savingsCornerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  // ── Coupon row (no coupon state) ──
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  couponRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  couponIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponRowText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  couponRowSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },

  // ── Searching state ──
  couponSearching: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  couponSearchingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },

  // ── Applied coupon card ──
  couponApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FFF4',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C3E6C3',
  },
  couponAppliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  couponAppliedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponAppliedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  couponAppliedCode: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.success,
  },
  autoBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  autoBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  couponAppliedLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  changeCouponLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  changeCouponText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },

  // ── Loading state for bill ──
  loadingBill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  loadingBillText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },

  // ── Bill ──
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
  },
  billLabelRow: { flexDirection: 'row', alignItems: 'center' },
  billLabel: { fontSize: 14, color: Colors.textSecondary },
  billLabelBold: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  billValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  billValueBold: { fontSize: 16, fontWeight: '800' },
  billValueGreen: { color: Colors.success, fontWeight: '700' },
  billValueStrike: { textDecorationLine: 'line-through', color: Colors.textLight },
  billDivider: { marginVertical: 8 },

  // ── Savings bar ──
  savingsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FFF4',
    marginBottom: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C3E6C3',
  },
  savingsText: { fontSize: 13, color: Colors.success, flex: 1 },
  savingsBold: { fontWeight: '800' },

  // ── Policy ──
  policyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 8,
  },
  policyText: { fontSize: 12, color: Colors.textLight, lineHeight: 18, flex: 1 },

  // ── Footer ──
  footer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    gap: 12,
  },
  footerTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  footerTotal: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  footerTotalSub: { fontSize: 12, color: Colors.textSecondary },
  checkoutBtn: { marginBottom: 0 },
});