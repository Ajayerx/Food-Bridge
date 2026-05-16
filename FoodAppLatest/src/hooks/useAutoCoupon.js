import { useEffect, useRef, useCallback, useState } from 'react';
import api from '../services/api/base';

/**
 * useAutoCoupon
 *
 * Automatically finds and applies the best available coupon whenever
 * the cart subtotal changes. Picks the eligible coupon with the highest
 * estimated discount. Silently re-evaluates if subtotal changes.
 *
 * CouponDto fields (snake_case_lower serializer):
 *   id, code, description, coupon_type ('Percentage'|'Flat'),
 *   discount_value, min_order_amount, max_discount_amount,
 *   usage_limit, usage_count, per_user_limit,
 *   restaurant_id, restaurant_name, status ('Active'|'Inactive'|'Expired'),
 *   expires_at, created_at
 *
 * Returns:
 *   appliedCoupon   — { code, discount_amount } | null
 *   autoApplying    — true while the background fetch+validate is running
 *   autoMessage     — human-readable string
 *   removeCoupon    — call to clear the coupon (user action)
 *   overrideCoupon  — call with a coupon object to replace with manually chosen one
 */
export function useAutoCoupon(restaurantId, subtotal) {
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [autoApplying, setAutoApplying] = useState(false);
    const [autoMessage, setAutoMessage] = useState('');

    const userRemovedRef = useRef(false);
    const lastSubtotalRef = useRef(null);
    const debounceTimerRef = useRef(null);

    const findAndApplyBest = useCallback(async (currentSubtotal) => {
        if (!restaurantId || currentSubtotal <= 0) return;

        setAutoApplying(true);
        setAutoMessage('');

        try {
            // ── Step 1: Fetch active coupons for this restaurant ───────────────
            // ✅ Real .NET route: GET /v1/coupons
            // ✅ Params: restaurant_id, active_only, page, page_size
            const listRes = await api.get('/coupons', {
                params: {
                    restaurant_id: restaurantId,
                    active_only: true,
                    page: 1,
                    page_size: 50,
                },
            });

            const allCoupons = listRes?.data?.data ?? [];

            // ── Step 2: Filter locally before hitting validate ─────────────────
            // ✅ status values: 'Active' | 'Inactive' | 'Expired'  (CouponStatus enum)
            // ✅ coupon_type values: 'Percentage' | 'Flat'          (CouponType enum)
            const eligible = allCoupons.filter(c => {
                // Must be Active status
                if (c.status !== 'Active') return false;

                // Cart must meet minimum order amount
                if (c.min_order_amount && currentSubtotal < c.min_order_amount) return false;

                // Must not be expired (double-check client side)
                if (c.expires_at && new Date(c.expires_at) < new Date()) return false;

                // Must not be fully redeemed
                if (c.usage_limit != null && c.usage_count >= c.usage_limit) return false;

                return true;
            });

            if (eligible.length === 0) {
                // Clear any previously auto-applied coupon silently
                setAppliedCoupon(prev => (prev?.autoApplied ? null : prev));
                setAutoApplying(false);
                return;
            }

            // ── Step 3: Rank by estimated discount ────────────────────────────
            // ✅ CouponType.Percentage → 'Percentage'
            // ✅ CouponType.Flat       → 'Flat'
            // ✅ max_discount_amount   (NOT max_discount — that field doesn't exist)
            const ranked = eligible.map(c => {
                let estimated = 0;

                if (c.coupon_type === 'Percentage') {
                    estimated = (currentSubtotal * c.discount_value) / 100;
                    if (c.max_discount_amount != null) {
                        estimated = Math.min(estimated, c.max_discount_amount);
                    }
                } else {
                    // CouponType.Flat — fixed amount off
                    estimated = c.discount_value;
                }

                return { ...c, estimated_discount: estimated };
            });

            ranked.sort((a, b) => b.estimated_discount - a.estimated_discount);
            const best = ranked[0];

            // ── Step 4: Skip if same coupon already applied ───────────────────
            // ── Step 4: Skip if same coupon already applied ───────────────────
            setAppliedCoupon(prev => {
                if (prev?.code === best.code) return prev;
                return null; // will be set below
            });
            if (appliedCoupon?.code === best.code) {
                setAutoApplying(false);
                return;
            }

            // ── Step 5: Validate with backend to get exact discount_amount ─────
            // ✅ ValidateCouponRequestDto fields (snake_case_lower):
            //     Code         → code
            //     RestaurantId → restaurant_id
            //     OrderAmount  → order_amount   (NOT cart_total, NOT order_total)
            // ✅ Only [Authorize(Roles = "Customer")] — token sent automatically
            const validateRes = await api.post('/coupons/validate', {
                code: best.code,
                restaurant_id: restaurantId,
                order_amount: currentSubtotal,     // ← was cart_total ❌
            });

            const { discount_amount } = validateRes.data.data;

            setAppliedCoupon({
                code: best.code,
                discount_amount,
                autoApplied: true,
            });

            setAutoMessage(
                `Best coupon applied: ${best.code} — you save ₹${discount_amount}!`
            );

        } catch (err) {
            // Coupon became invalid between list & validate — clear silently
            setAppliedCoupon(prev => (prev?.autoApplied ? null : prev));
            // Don't surface the error to the user — auto-coupon is a nice-to-have
        } finally {
            setAutoApplying(false);
        }
    }, [restaurantId]);

    // ── Watch subtotal + restaurant changes ───────────────────────────────────
    useEffect(() => {
        if (!subtotal || subtotal <= 0) return;

        // If user manually removed, only re-trigger when subtotal actually changes
        if (userRemovedRef.current) {
            if (subtotal === lastSubtotalRef.current) return;
            userRemovedRef.current = false; // subtotal changed — re-enable auto-apply
        }

        lastSubtotalRef.current = subtotal;

        // Debounce 600ms — wait for cart to settle before firing API calls
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            findAndApplyBest(subtotal);
        }, 600);

        return () => clearTimeout(debounceTimerRef.current);
    }, [subtotal, restaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Public actions ────────────────────────────────────────────────────────

    /** User explicitly removes the coupon — won't re-apply until subtotal changes */
    const removeCoupon = useCallback(() => {
        userRemovedRef.current = true;
        setAppliedCoupon(null);
        setAutoMessage('');
    }, []);

    /** Replace with a manually chosen coupon (from CouponScreen) */
    const overrideCoupon = useCallback((coupon) => {
        userRemovedRef.current = false;
        setAppliedCoupon({ ...coupon, autoApplied: false });
        setAutoMessage('');
    }, []);

    return {
        appliedCoupon,
        autoApplying,
        autoMessage,
        removeCoupon,
        overrideCoupon,
    };
}