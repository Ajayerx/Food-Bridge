import React, { useState, useRef, useEffect } from 'react';
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { Divider } from '../../components/common/Divider';
import { formatCurrency } from '../../utils/formatCurrency';
import { useUserStore } from '../../store/userStore';
import { useCart } from '../../hooks/useCart';
import { useOrderStore } from '../../store/orderStore';
import { useAddressStore } from "../../store/addressStore";




// ─── Constants ────────────────────────────────────────────
const STEPS = ['Cart', 'Address', 'Payment', 'Review'];


// ─── Step Indicator ───────────────────────────────────────
const StepIndicator = ({ currentStep }) => (
  <View style={styles.stepIndicator}>
    {STEPS.map((step, index) => {
      const isDone = index < currentStep;
      const isActive = index === currentStep;
      return (
        <React.Fragment key={step}>
          <View style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              isDone && styles.stepCircleDone,
              isActive && styles.stepCircleActive,
            ]}>
              {isDone ? (
                <Icon name="check" size={12} color={Colors.white} />
              ) : (
                <Text style={[
                  styles.stepNum,
                  isActive && styles.stepNumActive,
                ]}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              isActive && styles.stepLabelActive,
              isDone && styles.stepLabelDone,
            ]}>
              {step}
            </Text>
          </View>
          {index < STEPS.length - 1 && (
            <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
          )}
        </React.Fragment>
      );
    })}
  </View>
);

// ─── Address Card ─────────────────────────────────────────
const AddressCard = ({ addr, selected, onSelect }) => (
  <TouchableOpacity
    style={[styles.addressCard, selected && styles.addressCardSelected]}
    onPress={onSelect}
    activeOpacity={0.75}>
    <View style={[styles.addressIconBox, selected && styles.addressIconBoxSelected]}>
      <Icon name="location-on"
        size={18}
        color={selected ? Colors.primary : Colors.textSecondary}
      />
    </View>
    <View style={styles.addressInfo}>
      <View style={styles.addressTopRow}>
        <Text style={styles.addressType}>{addr.label}</Text>
        {!!addr.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Default</Text>
          </View>
        )}
      </View>
      <Text style={styles.addressText}>{addr.address_line1}</Text>
      <Text style={styles.addressCity}>
        {addr.city} — {addr.pin_code}
      </Text>
    </View>
    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
      {selected && <View style={styles.radioInner} />}
    </View>
  </TouchableOpacity>
);

// ─── Payment Method Card ──────────────────────────────────
const PaymentCard = ({ method, selected, onSelect }) => (
  <TouchableOpacity
    style={[styles.paymentCard, selected && styles.paymentCardSelected]}
    onPress={onSelect}
    activeOpacity={0.75}>
    <View style={[styles.paymentIconBox, selected && styles.paymentIconBoxSelected]}>
      <Icon
        name={method.icon}
        size={20}
        color={selected ? Colors.primary : Colors.textSecondary}
      />
    </View>
    <View style={styles.paymentInfo}>
      <View style={styles.paymentTopRow}>
        <Text style={[styles.paymentLabel, selected && styles.paymentLabelSelected]}>
          {method.label}
        </Text>
        {method.badge && (
          <View style={[styles.methodBadge, { backgroundColor: method.badgeColor + '22' }]}>
            <Text style={[styles.methodBadgeText, { color: method.badgeColor }]}>
              {method.badge}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.paymentSubtitle}>{method.subtitle}</Text>
    </View>
    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
      {selected && <View style={styles.radioInner} />}
    </View>
  </TouchableOpacity>
);

// ─── Order Item Row ───────────────────────────────────────
const OrderItemRow = ({ item }) => (
  <View style={styles.orderItemRow}>
    <View style={styles.orderItemLeft}>
      <View style={[
        styles.vegDot,
        { backgroundColor: item.veg ? Colors.vegGreen : Colors.nonVegRed },
      ]} />
      <Text style={styles.orderItemName} numberOfLines={1}>
        {item.name}
      </Text>
    </View>

    <Text style={styles.orderItemQty}>×{item.quantity}</Text>

    <Text style={styles.orderItemPrice}>
      {formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 1))}
    </Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────
export const CheckoutScreen = ({ route, navigation }) => {
  // ✅ FIX: Use breakdown passed from CartScreen — no recalculation here
  const {
    subtotal = 0,
    deliveryFee = 30,
    gst = 0,
    platformFee = 0,
    discount = 0,
    total = 0,
    couponCode,
  } = route.params;
  const [selectedMethod, setSelectedMethod] = useState(null);

  const user = useUserStore(s => s.user);
  const { items, restaurantId, restaurantName, clearCart } = useCart();
  const { placeOrder, isPlacing } = useOrderStore();

  const paymentMethods = [
    {
      category: "Online Payment",
      methods: [
        { id: "online", label: "Online Payment", icon: "payment", subtitle: "UPI, Cards, Net Banking", badge: "SECURE", badgeColor: "#2E7D32" },
      ]
    },
    {
      category: "Cash",
      methods: [
        { id: "cod", label: "Cash on Delivery", icon: "money", subtitle: "Pay when your order arrives", badge: null, badgeColor: null },
      ]
    }
  ];
  const [currentStep, setCurrentStep] = useState(1);

  const addresses = useAddressStore(s => s.addresses);
  const selectedAddressStore = useAddressStore(s => s.selectedAddress);
  const defaultAddress = addresses?.find(a => a.is_default);
  const [selectedAddress, setSelectedAddress] = useState(
    selectedAddressStore?.id || defaultAddress?.id || null
  );
  // Sync selected address with store
  useEffect(() => {
    if (!selectedAddress && addresses?.length > 0) {
      const def = addresses.find(a => a.is_default);
      if (def) {
        setSelectedAddress(def.id);
      }
    }
  }, [addresses]);





  const slideAnim = useRef(new Animated.Value(0)).current;

  const addressesList = addresses || [];
  const activeAddress =
    addressesList.find(a => a.id === selectedAddress);

  const goToStep = step => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(step);
      slideAnim.setValue(0);
    });
  };
  const [loading, setLoading] = useState(false);

  // ✅ FIX: All price values come from route.params (calculated once in CartScreen)
  // deliveryFee, gst, platformFee, subtotal, discount, total — all from params
  const finalTotal = total; // already correct from CartScreen

  const handlePlaceOrder = async () => {

    if (loading) return;

    if (!items || items.length === 0) {
      Alert.alert("Cart is empty");
      return;
    }
    if (!activeAddress) {
      Alert.alert("Please select delivery address");
      return;
    }
    if (!selectedMethod?.id) {
      Alert.alert("Please select payment method");
      return;
    }

    setLoading(true);

    try {
      const newOrder = await placeOrder(
        {
          restaurantId,
          restaurantName,
          items,
          couponCode: couponCode || undefined,
          // ✅ FIX: Pass deliveryFee so orderStore forwards it to backend
          deliveryFee,
        },
        activeAddress,
        selectedMethod?.id
      );

      if (!newOrder) throw new Error("Order failed");

      clearCart();

      navigation.replace("OrderTrackingScreen", {
        orderId: newOrder.id
      });

    } catch (e) {
      const msg = e?.response?.data?.error?.message || e.message || "Failed to place order";
      Alert.alert(
        "Order Failed",
        msg,
        [{ text: "OK" }]
      );
    }

    setLoading(false);
  };
  console.log("PAYMENT METHODS:", paymentMethods);
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      {/* ── Step Indicator ── */}
      <View style={styles.stepsContainer}>
        <StepIndicator currentStep={currentStep} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* ══════════════════════════════════════════
            STEP 1 — DELIVERY ADDRESS
        ══════════════════════════════════════════ */}
        <View style={styles.stepSection}>
          <View style={styles.stepSectionHeader}>
            <View style={styles.stepSectionLeft}>
              <View style={[
                styles.stepSectionNum,
                currentStep >= 1 && styles.stepSectionNumActive,
              ]}>
                {currentStep > 1 ? (
                  <Icon name="check" size={14} color={Colors.white} />
                ) : (
                  <Text style={styles.stepSectionNumText}>1</Text>
                )}
              </View>
              <Text style={styles.stepSectionTitle}>Delivery Address</Text>
            </View>
            {currentStep > 1 && (
              <TouchableOpacity onPress={() => goToStep(1)}>
                <Text style={styles.changeBtn}>Change</Text>
              </TouchableOpacity>
            )}
          </View>

          {currentStep === 1 ? (
            <View style={styles.stepContent}>
              {addressesList.map(addr => (
                <AddressCard
                  key={addr.id}
                  addr={addr}
                  selected={selectedAddress === addr.id}
                  onSelect={() => setSelectedAddress(addr.id)}
                />
              ))}
              <TouchableOpacity
                style={styles.addNewBtn}
                onPress={() => navigation.navigate("AddAddressScreen")}
              >
                <Icon name="add-location-alt" size={18} color={Colors.primary} />
                <Text style={styles.addNewBtnText}>Add New Address</Text>
              </TouchableOpacity>
              <Button
                title="Deliver Here →"
                onPress={() => {
                  if (!selectedAddress) {
                    Alert.alert("Please select a delivery address");
                    return;
                  }
                  goToStep(2);
                }}
                style={styles.stepBtn}
              />
            </View>
          ) : (
            // Collapsed summary
            <View style={styles.collapsedSummary}>
              <Icon name={activeAddress.icon || 'location-on'} size={16} color={Colors.primary} />
              <Text style={styles.collapsedText} numberOfLines={1}>
                {activeAddress.address_line1}, {activeAddress.city}
              </Text>
            </View>
          )}
        </View>

        <Divider thick />

        {/* ══════════════════════════════════════════
            STEP 2 — PAYMENT
        ══════════════════════════════════════════ */}
        <View style={[styles.stepSection, currentStep < 2 && styles.stepSectionLocked]}>
          <View style={styles.stepSectionHeader}>
            <View style={styles.stepSectionLeft}>
              <View style={[
                styles.stepSectionNum,
                currentStep >= 2 && styles.stepSectionNumActive,
              ]}>
                {currentStep > 2 ? (
                  <Icon name="check" size={14} color={Colors.white} />
                ) : (
                  <Text style={styles.stepSectionNumText}>2</Text>
                )}
              </View>
              <Text style={[
                styles.stepSectionTitle,
                currentStep < 2 && styles.stepSectionTitleLocked,
              ]}>
                Payment Method
              </Text>
            </View>
            {currentStep > 2 && (
              <TouchableOpacity onPress={() => goToStep(2)}>
                <Text style={styles.changeBtn}>Change</Text>
              </TouchableOpacity>
            )}
          </View>

          {currentStep === 2 ? (
            <View style={styles.stepContent}>
              {paymentMethods?.map(section => (
                <View key={section.category}>

                  <Text style={styles.paymentCategory}>
                    {section.category}
                  </Text>

                  {section.methods.map(method => (
                    <PaymentCard
                      key={method.id}
                      method={method}
                      selected={selectedMethod?.id === method.id}
                      onSelect={() => {

                        if (method.id === "add_card") {
                          navigation.navigate("AddCard");
                          return;
                        }

                        setSelectedMethod(method);

                      }}
                    />
                  ))}

                </View>
              ))}
              <Button
                title="Continue →"
                onPress={() => {
                  if (!selectedMethod?.id) {
                    Alert.alert("Please select a payment method");
                    return;
                  }
                  goToStep(3);
                }}
                style={styles.stepBtn}
              />

            </View>
          ) : currentStep > 2 ? (
            <View style={styles.collapsedSummary}>
              <Icon name={selectedMethod?.icon || 'payment'} size={16} color={Colors.primary} />
              <Text style={styles.collapsedText}>{selectedMethod?.label}</Text>
            </View>
          ) : null}
        </View>

        <Divider thick />

        {/* ══════════════════════════════════════════
            STEP 3 — ORDER REVIEW
        ══════════════════════════════════════════ */}
        <View style={[styles.stepSection, currentStep < 3 && styles.stepSectionLocked]}>
          <View style={styles.stepSectionHeader}>
            <View style={styles.stepSectionLeft}>
              <View style={[
                styles.stepSectionNum,
                currentStep >= 3 && styles.stepSectionNumActive,
              ]}>
                <Text style={styles.stepSectionNumText}>3</Text>
              </View>
              <Text style={[
                styles.stepSectionTitle,
                currentStep < 3 && styles.stepSectionTitleLocked,
              ]}>
                Review Order
              </Text>
            </View>
          </View>

          {currentStep === 3 && (
            <View style={styles.stepContent}>
              {/* Restaurant */}
              <View style={styles.reviewRestRow}>
                <Icon name="restaurant" size={16} color={Colors.primary} />
                <Text style={styles.reviewRestName}>{restaurantName}</Text>
              </View>

              {/* Items */}
              <View style={styles.reviewItems}>
                {items?.map(item => (
                  <OrderItemRow
                    key={item.id}
                    item={item}
                  />
                ))}
              </View>

              <Divider style={styles.reviewDivider} />

              {/* Bill Summary */}
              <View style={styles.reviewBill}>
                <View style={styles.reviewBillRow}>
                  <Text style={styles.reviewBillLabel}>Item Total</Text>
                  <Text style={styles.reviewBillValue}>
                    {formatCurrency(subtotal)}
                  </Text>
                </View>
                {discount > 0 && (
                  <View style={styles.reviewBillRow}>
                    <Text style={styles.reviewBillLabel}>
                      Discount ({couponCode})
                    </Text>
                    <Text style={[styles.reviewBillValue, { color: Colors.success }]}>
                      -{formatCurrency(discount)}
                    </Text>
                  </View>
                )}
                <View style={styles.reviewBillRow}>
                  <Text style={styles.reviewBillLabel}>Delivery Fee</Text>
                  <Text style={[styles.reviewBillValue, deliveryFee === 0 && { color: '#27AE60', fontWeight: '700' }]}>
                    {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
                  </Text>
                </View>
                {gst > 0 && (
                  <View style={styles.reviewBillRow}>
                    <Text style={styles.reviewBillLabel}>GST & Charges</Text>
                    <Text style={styles.reviewBillValue}>{formatCurrency(gst)}</Text>
                  </View>
                )}
                {platformFee > 0 && (
                  <View style={styles.reviewBillRow}>
                    <Text style={styles.reviewBillLabel}>Platform Fee</Text>
                    <Text style={styles.reviewBillValue}>{formatCurrency(platformFee)}</Text>
                  </View>
                )}
                <Divider style={styles.reviewDivider} />
                <View style={styles.reviewBillRow}>
                  <Text style={styles.reviewTotalLabel}>Total</Text>
                  <Text style={styles.reviewTotalValue}>
                    {formatCurrency(finalTotal)}
                  </Text>
                </View>
              </View>

              {/* Delivery + Payment summary */}
              <View style={styles.reviewMetaRow}>
                <View style={styles.reviewMeta}>
                  <Icon name="location-on" size={14} color={Colors.textLight} />
                  <Text style={styles.reviewMetaText} numberOfLines={1}>
                    {activeAddress.address_line1}
                  </Text>
                </View>
                <View style={styles.reviewMeta}>
                  <Icon name={selectedMethod?.icon} size={14} color={Colors.textLight} />
                  <Text style={styles.reviewMetaText}>
                    {selectedMethod?.label}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Footer ── */}
      {currentStep === 3 && (
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <Text style={styles.footerTotal}>{formatCurrency(total)}</Text>
            <Text style={styles.footerSub}>
              {selectedMethod
                ? `💳 Pay via ${selectedMethod.label}`
                : 'Select payment method'}
            </Text>
          </View>
          <Button
            title={isPlacing ? 'Placing Order...' : 'Place Order 🎉'}
            onPress={handlePlaceOrder}
            loading={isPlacing}
            style={styles.placeOrderBtn}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 32 },

  // ── Step Indicator ──
  stepsContainer: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  stepCircleDone: {
    borderColor: Colors.success,
    backgroundColor: Colors.success,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
  },
  stepNumActive: {
    color: Colors.primary,
  },
  stepLabel: {
    fontSize: 10,
    color: Colors.textLight,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  stepLabelDone: {
    color: Colors.success,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginBottom: 16,
    marginHorizontal: 4,
  },
  stepLineDone: {
    backgroundColor: Colors.success,
  },

  // ── Step Section ──
  stepSection: {
    backgroundColor: Colors.white,
    padding: 16,
  },
  stepSectionLocked: {
    opacity: 0.45,
  },
  stepSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepSectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepSectionNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepSectionNumActive: {
    backgroundColor: Colors.primary,
  },
  stepSectionNumText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
  },
  stepSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stepSectionTitleLocked: {
    color: Colors.textLight,
  },
  changeBtn: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  stepContent: { gap: 12 },
  stepBtn: { marginTop: 8 },

  // Collapsed
  collapsedSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 10,
  },
  collapsedText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },

  // ── Address ──
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    gap: 12,
  },
  addressCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  addressIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressIconBoxSelected: {
    backgroundColor: Colors.white,
  },
  addressInfo: { flex: 1, gap: 2 },
  addressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  addressType: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  defaultBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  addressText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  addressCity: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  addNewBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  // ── Payment ──
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    gap: 12,
  },
  paymentCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  paymentIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentIconBoxSelected: {
    backgroundColor: Colors.white,
  },
  paymentInfo: { flex: 1 },
  paymentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  paymentLabelSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  paymentSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  methodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  paymentCategory: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textLight,
    marginTop: 10,
    marginBottom: 6
  },

  // Radio
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },

  // ── Review ──
  reviewRestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  reviewRestName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  reviewItems: {
    gap: 10,
    marginBottom: 4,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vegDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  orderItemName: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  orderItemQty: {
    fontSize: 13,
    color: Colors.textSecondary,
    width: 28,
    textAlign: 'center',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    width: 70,
    textAlign: 'right',
  },
  reviewDivider: { marginVertical: 12 },
  reviewBill: { gap: 8 },
  reviewBillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewBillLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  reviewBillValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  reviewTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  reviewTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  reviewMetaRow: {
    gap: 6,
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 10,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },

  // ── Footer ──
  footer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    gap: 12,
  },
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerTotal: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  footerSub: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  placeOrderBtn: { marginBottom: 0 },
});