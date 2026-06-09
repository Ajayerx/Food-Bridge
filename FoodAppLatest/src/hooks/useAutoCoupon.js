import { useEffect, useRef, useCallback, useState } from 'react';
import api from '../services/api/base';

/**
 * useAutoCoupon
 *
 * Automatically finds and applies the best available coupon whenever
 * the cart subtotal changes. Picks the eligible coupon with the highest
 * estimated discount. Silently re-evaluates if subtotal changes.
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
            const eligible = allCoupons.filter(c => {
                if (c.status !== 'Active') return false;
                if (c.min_order_amount && currentSubtotal < c.min_order_amount) return false;
                if (c.expires_at && new Date(c.expires_at) < new Date()) return false;
                if (c.usage_limit != null && c.usage_count >= c.usage_limit) return false;
                return true;
            });

            if (eligible.length === 0) {
                setAppliedCoupon(prev => (prev?.autoApplied ? null : prev));
                setAutoApplying(false);
                return;
            }

            // ── Step 3: Rank by estimated discount ────────────────────────────
            const ranked = eligible.map(c => {
                let estimated = 0;
                if (c.coupon_type === 'Percentage') {
                    estimated = (currentSubtotal * c.discount_value) / 100;
                    if (c.max_discount_amount != null)
                        estimated = Math.min(estimated, c.max_discount_amount);
                } else {
                    estimated = c.discount_value;
                }
                return { ...c, estimated_discount: estimated };
            });

            ranked.sort((a, b) => b.estimated_discount - a.estimated_discount);

            // ── Step 4: Try each coupon in rank order until one validates ──────
            // FIX: Previously took only ranked[0] and applied it even if
            // is_valid=false (e.g. coupon scoped to a different restaurant).
            // Now we walk the ranked list and use the first one that actually
            // passes backend validation — with is_valid AND discount_amount > 0.
            let applied = false;

            for (const candidate of ranked) {
                // Skip if this coupon is already applied — no need to re-validate
                if (appliedCoupon?.code === candidate.code) {
                    applied = true;
                    break;
                }

                try {
                    const validateRes = await api.post('/coupons/validate', {
                        code: candidate.code,
                        restaurant_id: restaurantId,
                        order_amount: currentSubtotal,
                    });

                    const { is_valid, discount_amount, message } = validateRes.data.data;

                    // ✅ FIX: Check is_valid AND discount_amount > 0.
                    // Coupon scoped to another restaurant returns is_valid=false,
                    // discount_amount=0 — previously this still called setAppliedCoupon,
                    // showing the badge with "You saved ₹0 on this order".
                    if (!is_valid || discount_amount <= 0) {
                        // This candidate failed — try the next best one
                        continue;
                    }

                    setAppliedCoupon({
                        code: candidate.code,
                        discount_amount,
                        autoApplied: true,
                    });

                    setAutoMessage(
                        `Best coupon applied: ${candidate.code} — you save ₹${discount_amount}!`
                    );

                    applied = true;
                    break; // Found a valid one — stop

                } catch {
                    // Validate call failed for this candidate — try next
                    continue;
                }
            }

            // No valid coupon found — clear any previously auto-applied one
            if (!applied) {
                setAppliedCoupon(prev => (prev?.autoApplied ? null : prev));
                // Don't show an error — auto-coupon is a nice-to-have, fail silently
            }

        } catch (err) {
            // List fetch failed — clear auto-applied coupon silently
            setAppliedCoupon(prev => (prev?.autoApplied ? null : prev));
        } finally {
            setAutoApplying(false);
        }
    }, [restaurantId]); // ← removed appliedCoupon dep to avoid loop; read via setAppliedCoupon(prev)

    // ── Watch subtotal + restaurant changes ───────────────────────────────────
    useEffect(() => {
        if (!subtotal || subtotal <= 0) return;

        if (userRemovedRef.current) {
            if (subtotal === lastSubtotalRef.current) return;
            userRemovedRef.current = false;
        }

        lastSubtotalRef.current = subtotal;

        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            findAndApplyBest(subtotal);
        }, 600);

        return () => clearTimeout(debounceTimerRef.current);
    }, [subtotal, restaurantId, findAndApplyBest]);

    const removeCoupon = useCallback(() => {
        userRemovedRef.current = true;
        setAppliedCoupon(null);
        setAutoMessage('');
    }, []);

    const overrideCoupon = useCallback((coupon) => {
        userRemovedRef.current = false;
        setAppliedCoupon({ ...coupon, autoApplied: false });
        setAutoMessage('');
    }, []);

    return { appliedCoupon, autoApplying, autoMessage, removeCoupon, overrideCoupon };
}