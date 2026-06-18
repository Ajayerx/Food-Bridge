import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    StatusBar,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../hooks/useTheme';
import { useUserStore } from '../../store/userStore';
import { formatCurrency } from '../../utils/formatCurrency';
import api from '../../services/api/base';

// ─── Main Screen ──────────────────────────────────────────
export const CouponScreen = ({ route, navigation }) => {
    const Colors = useTheme();
    const darkMode = useUserStore(s => s.darkMode);
    const styles = useMemo(() => createStyles(Colors), [Colors]);

    const { restaurantId, cartTotal, onCouponApplied } = route.params;

    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [manualCode, setManualCode] = useState('');

    // BUG 8 FIX: Split applying state into two independent flags.
    // Old: a single `applying` string was used for BOTH the manual input spinner
    // (`applying === manualCode.toUpperCase()`) AND card-level spinners
    // (`applying === item.code`). If the typed code happened to match a listed
    // coupon's code, BOTH spinners showed at once.
    //
    // Fix: `cardApplying` tracks which card's code is being validated (string | null).
    // `manualApplying` is a simple boolean for the manual input row.
    const [cardApplying, setCardApplying] = useState(null);
    const [manualApplying, setManualApplying] = useState(false);

    const [error, setError] = useState('');
    const [fetchError, setFetchError] = useState('');

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        setFetchError('');
        try {
            const res = await api.get('/coupons', {
                params: {
                    restaurant_id: restaurantId,
                    active_only: true,
                    page: 1,
                    page_size: 50,
                },
            });
            setCoupons(res.data.data || []);
        } catch (e) {
            // BUG 9 FIX: Distinguish auth/network failures from empty-list.
            // Old: catch silently set setCoupons([]) for ALL errors — a 401 or
            // network failure looked identical to "no coupons available".
            // Fix: surface a fetchError string for non-empty-list failures so the
            // UI can show "Failed to load" with a retry instead of "No coupons".
            const status = e?.response?.status;
            if (status === 401 || status === 403) {
                setFetchError('Session expired. Please log in again.');
            } else if (!e?.response) {
                setFetchError('Network error. Check your connection.');
            } else {
                setFetchError('Failed to load coupons. Tap to retry.');
            }
            setCoupons([]);
        } finally {
            setLoading(false);
        }
    };

    // BUG 6 NOTE: onCouponApplied is a callback passed via route.params.
    // React Navigation captures the param reference at navigation time. If CartScreen
    // re-renders and the callback identity changes, the captured ref here goes stale.
    // The current usage (overrideCoupon from useAutoCoupon) is stable via useCallback
    // in the hook, so this is safe — but document the dependency for future maintainers.
    // A more robust pattern would be to write to a shared store instead of a callback.
    // Only the applyCode function needs to change in CouponScreen.js
    // Replace your existing applyCode with this:

    const applyCode = async (code, isManual = false) => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) { setError('Please enter a coupon code'); return; }

        if (isManual) {
            setManualApplying(true);
        } else {
            setCardApplying(trimmed);
        }
        setError('');

        try {
            const res = await api.post('/coupons/validate', {
                code: trimmed,
                restaurant_id: restaurantId,
                order_amount: cartTotal,
            });

            const { is_valid, discount_amount, message } = res.data.data;

            // ✅ FIX: Check is_valid before applying.
            // Previously read only discount_amount and called onCouponApplied
            // unconditionally — so an invalid coupon (wrong restaurant, expired,
            // usage limit hit) would still show as "applied" with ₹0 savings.
            if (!is_valid) {
                // Show the backend's rejection reason (e.g. "Coupon is not valid
                // for this restaurant") instead of silently applying with ₹0.
                setError(message || 'Coupon is not valid');
                return;
            }

            if (discount_amount <= 0) {
                // Coupon technically valid but gives no discount for this order amount
                setError('This coupon gives no discount on your current cart');
                return;
            }

            onCouponApplied({
                code: trimmed,
                discount_amount,
                label: `${trimmed} applied!`,
            });

            navigation.goBack();

        } catch (e) {
            const msg = e?.response?.data?.error?.message || 'Invalid or expired coupon';
            setError(msg);
        } finally {
            if (isManual) {
                setManualApplying(false);
            } else {
                setCardApplying(null);
            }
        }
    };

    const CouponCard = ({ coupon, cartTotal, onApply, applying }) => {
        const [expanded, setExpanded] = useState(false);

        const expandAnim = useRef(new Animated.Value(0)).current;
        const maxHeightInterp = expandAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 200],
        });

        const isEligible = cartTotal >= (coupon.min_order_amount ?? 0);
        const shortfall = isEligible ? 0 : (coupon.min_order_amount ?? 0) - cartTotal;

        const discountLabel = coupon.coupon_type === 'Percentage'
            ? `${coupon.discount_value}% OFF${coupon.max_discount_amount
                ? ` (max ₹${coupon.max_discount_amount})`
                : ''}`
            : `₹${coupon.discount_value} OFF`;

        const toggleExpand = () => {
            const toValue = expanded ? 0 : 1;
            setExpanded(!expanded);
            Animated.timing(expandAnim, {
                toValue,
                duration: 220,
                useNativeDriver: false,
            }).start();
        };

        return (
            <View style={[styles.couponCard, !isEligible && styles.couponCardDisabled]}>
                <View style={[styles.couponStub, !isEligible && styles.couponStubDisabled]}>
                    <Text style={styles.couponStubText} numberOfLines={2}>
                        {discountLabel}
                    </Text>
                    <View style={styles.stubNotchTop} />
                    <View style={styles.stubNotchBottom} />
                </View>

                <View style={styles.couponContent}>
                    <View style={styles.couponTop}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.couponCode, !isEligible && styles.textDisabled]}>
                                {coupon.code}
                            </Text>
                            {!isEligible && shortfall > 0 ? (
                                <Text style={styles.couponShortfall}>
                                    Add {formatCurrency(shortfall)} more to avail this offer
                                </Text>
                            ) : (
                                <Text style={[styles.couponSummary, !isEligible && styles.textDisabled]}>
                                    {discountLabel}
                                </Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.applyBtn, !isEligible && styles.applyBtnDisabled]}
                            onPress={() => isEligible && onApply(coupon.code)}
                            disabled={!isEligible || applying}
                            activeOpacity={0.75}
                        >
                            {applying ? (
                                <ActivityIndicator
                                    size="small"
                                    color={isEligible ? Colors.primary : Colors.textLight}
                                />
                            ) : (
                                <Text style={[
                                    styles.applyBtnText,
                                    !isEligible && styles.applyBtnTextDisabled,
                                ]}>
                                    APPLY
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {(coupon.min_order_amount ?? 0) > 0 && (
                        <Text style={[styles.couponMinOrder, !isEligible && styles.textDisabled]}>
                            Min order: {formatCurrency(coupon.min_order_amount)}
                        </Text>
                    )}

                    <View style={styles.couponDivider} />

                    <TouchableOpacity onPress={toggleExpand} activeOpacity={0.7}>
                        <Animated.View style={{ maxHeight: maxHeightInterp, overflow: 'hidden' }}>
                            <Text style={styles.couponDescription}>
                                Use code {coupon.code} & get {discountLabel}
                                {(coupon.min_order_amount ?? 0) > 0
                                    ? ` on orders above ₹${coupon.min_order_amount}`
                                    : ''}.
                                {coupon.max_discount_amount
                                    ? ` Maximum discount: ₹${coupon.max_discount_amount}.`
                                    : ''}
                            </Text>
                        </Animated.View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={toggleExpand} activeOpacity={0.7}>
                        <Text style={styles.moreText}>{expanded ? '- LESS' : '+ MORE'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const eligibleCoupons = coupons.filter(c => cartTotal >= (c.min_order_amount ?? 0));
    const ineligibleCoupons = coupons.filter(c => cartTotal < (c.min_order_amount ?? 0));
    const sortedCoupons = [...eligibleCoupons, ...ineligibleCoupons];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar backgroundColor={Colors.surface} barStyle={darkMode ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back-ios" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>APPLY COUPON</Text>
                    <Text style={styles.headerSub}>Your cart: {formatCurrency(cartTotal)}</Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            {/* Manual Input */}
            <View style={styles.inputSection}>
                <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
                    <TextInput
                        style={styles.input}
                        value={manualCode}
                        onChangeText={t => { setManualCode(t.toUpperCase()); setError(''); }}
                        placeholder="Enter Coupon Code"
                        placeholderTextColor={Colors.textLight}
                        autoCapitalize="characters"
                        returnKeyType="done"
                        onSubmitEditing={() => applyCode(manualCode, true)}
                    />
                    <TouchableOpacity
                        style={[styles.inputApplyBtn, !manualCode && styles.inputApplyBtnDisabled]}
                        onPress={() => applyCode(manualCode, true)}
                        // BUG 8 FIX: disabled now uses manualApplying, not the shared applying string
                        disabled={!manualCode || manualApplying}
                    >
                        {/* BUG 8 FIX: spinner uses manualApplying boolean */}
                        {manualApplying ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                            <Text style={[styles.inputApplyText, !manualCode && styles.inputApplyTextDisabled]}>
                                APPLY
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
                {error ? (
                    <View style={styles.errorRow}>
                        <Icon name="error-outline" size={14} color={Colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}
            </View>

            {/* Coupon List */}
            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Fetching offers...</Text>
                </View>
            ) : fetchError ? (
                // BUG 9 FIX: Show error + retry instead of empty state for real failures
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyEmoji}>⚠️</Text>
                    <Text style={styles.emptyTitle}>Couldn't load coupons</Text>
                    <Text style={styles.emptySub}>{fetchError}</Text>
                    <TouchableOpacity onPress={fetchCoupons} style={styles.retryBtn}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : sortedCoupons.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyEmoji}>🎟️</Text>
                    <Text style={styles.emptyTitle}>No coupons available</Text>
                    <Text style={styles.emptySub}>Check back later for offers</Text>
                </View>
            ) : (
                <FlatList
                    data={sortedCoupons}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <Text style={styles.listTitle}>
                            {eligibleCoupons.length > 0
                                ? `${eligibleCoupons.length} offer${eligibleCoupons.length > 1 ? 's' : ''} available`
                                : 'More offers'}
                        </Text>
                    }
                    renderItem={({ item }) => (
                        <CouponCard
                            coupon={item}
                            cartTotal={cartTotal}
                            // BUG 8 FIX: pass onApply with isManual=false for card taps
                            onApply={(code) => applyCode(code, false)}
                            // BUG 8 FIX: spinner driven by cardApplying, not shared string
                            applying={cardApplying === item.code}
                        />
                    )}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                />
            )}
        </SafeAreaView>
    );
};

const createStyles = (C) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: C.surface,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        elevation: 2,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 15, fontWeight: '900', color: C.textPrimary, letterSpacing: 0.5 },
    headerSub: { fontSize: 12, color: C.textSecondary, marginTop: 1 },

    // Input
    inputSection: {
        backgroundColor: C.surface,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        marginBottom: 8,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: C.border,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: C.surface,
    },
    inputRowError: { borderColor: C.error },
    input: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 14,
        fontWeight: '600',
        color: C.textPrimary,
        letterSpacing: 1,
    },
    inputApplyBtn: {
        paddingHorizontal: 18,
        paddingVertical: 13,
        borderLeftWidth: 1,
        borderLeftColor: C.border,
    },
    inputApplyBtnDisabled: { opacity: 0.4 },
    inputApplyText: { fontSize: 13, fontWeight: '800', color: C.primary },
    inputApplyTextDisabled: { color: C.textLight },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
    errorText: { fontSize: 12, color: C.error, flex: 1 },

    // Loading / Empty
    loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 14, color: C.textSecondary },
    emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    emptyEmoji: { fontSize: 52 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
    emptySub: { fontSize: 13, color: C.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
    retryBtn: {
        marginTop: 8,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: C.primary,
    },
    retryBtnText: { fontSize: 14, fontWeight: '700', color: C.primary },

    // List
    listContent: { padding: 16, paddingBottom: 40 },
    listTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: C.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 12,
    },

    // Coupon Card
    couponCard: {
        flexDirection: 'row',
        backgroundColor: C.surface,
        borderRadius: 14,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: C.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    couponCardDisabled: { opacity: 0.7 },

    // Ticket stub (left side)
    couponStub: {
        width: 72,
        backgroundColor: C.primary,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        position: 'relative',
    },
    couponStubDisabled: { backgroundColor: C.borderDark },
    couponStubText: {
        color: C.white,
        fontWeight: '900',
        fontSize: 13,
        textAlign: 'center',
        transform: [{ rotate: '-90deg' }],
        width: 80,
    },
    stubNotchTop: {
        position: 'absolute',
        top: -10,
        right: -10,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: C.background,
    },
    stubNotchBottom: {
        position: 'absolute',
        bottom: -10,
        right: -10,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: C.background,
    },

    // Card content
    couponContent: { flex: 1, padding: 14, gap: 4 },
    couponTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    couponCode: { fontSize: 15, fontWeight: '800', color: C.textPrimary, letterSpacing: 0.5 },
    couponSummary: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
    couponShortfall: { fontSize: 12, color: C.primary, fontWeight: '600', marginTop: 2 },
    couponMinOrder: { fontSize: 11, color: C.textLight },
    couponDivider: {
        height: 1,
        borderWidth: 1,
        borderColor: C.border,
        borderStyle: 'dashed',
        marginVertical: 8,
    },
    couponDescription: { fontSize: 12, color: C.textSecondary, lineHeight: 18 },
    moreRow: { flexDirection: 'row' },
    moreText: { fontSize: 12, fontWeight: '700', color: C.primary, marginTop: 4 },
    textDisabled: { color: C.textLight },

    // Apply button inside card
    applyBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: C.primary,
        minWidth: 64,
        alignItems: 'center',
    },
    applyBtnDisabled: { borderColor: C.border },
    applyBtnText: { fontSize: 12, fontWeight: '800', color: C.primary },
    applyBtnTextDisabled: { color: C.textLight },
});