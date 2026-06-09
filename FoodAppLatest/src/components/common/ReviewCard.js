// components/common/ReviewCard.js
import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ActivityIndicator, Alert, Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { submitReview, getOrderReview } from '../../services/review/reviewService';

export const ReviewCard = ({ orderId, restaurantId, style }) => {
    const [selected, setSelected] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [existingReview, setExistingReview] = useState(null);
    const [loadingExisting, setLoadingExisting] = useState(true);

    // Animation for star pop effect
    const starAnimations = useState([...Array(5)].map(() => new Animated.Value(1)))[0];

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
                    if ((review.vendor_reply || review.reply_text) && pollInterval) {
                        clearInterval(pollInterval);
                        pollInterval = null;
                    }
                }
            } catch (e) { console.log('Review fetch error', e) }
            finally {
                if (!cancelled) setLoadingExisting(false);
            }
        };

        fetchReview();
        pollInterval = setInterval(() => { if (!cancelled) fetchReview(); }, 30000);

        return () => {
            cancelled = true;
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [orderId]);

    const handleStarPress = (star) => {
        setSelected(star);
        Animated.sequence([
            Animated.timing(starAnimations[star - 1], { toValue: 1.4, duration: 100, useNativeDriver: true }),
            Animated.spring(starAnimations[star - 1], { toValue: 1, friction: 3, useNativeDriver: true }),
        ]).start();
    };

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
    }, [orderId, selected, comment, restaurantId]);

    if (loadingExisting) {
        return <View style={[rvStyles.card, style]}><ActivityIndicator color={Colors.primary} size="small" /></View>;
    }

    // ── State: Submitted with Vendor Reply ──────────────────────────────
    if (submitted && existingReview) {
        const replyText = existingReview.vendor_reply || existingReview.reply_text;
        const repliedAt = existingReview.replied_at || existingReview.replied_at;

        return (
            <View style={[rvStyles.card, style]}>
                <View style={rvStyles.thankRow}>
                    <Text style={rvStyles.thankEmoji}>🙏</Text>
                    <Text style={rvStyles.thankTitle}>Thanks for your review!</Text>
                </View>
                <View style={rvStyles.starsRowSmall}>
                    {[1, 2, 3, 4, 5].map(s => (
                        <Icon key={s} name={s <= existingReview.rating ? 'star' : 'star-border'}
                            size={20} color={s <= existingReview.rating ? '#F39C12' : Colors.border} />
                    ))}
                </View>
                {existingReview.comment ? (
                    <Text style={rvStyles.savedComment}>"{existingReview.comment}"</Text>
                ) : null}

                {replyText ? (
                    <View style={rvStyles.replyBox}>
                        <View style={rvStyles.replyHeader}>
                            <View style={rvStyles.replyIconCircle}>
                                <Icon name="store" size={12} color="#fff" />
                            </View>
                            <View>
                                <Text style={rvStyles.replyFrom}>Restaurant's Response</Text>
                                {repliedAt && (
                                    <Text style={rvStyles.replyDate}>
                                        {new Date(repliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <View style={rvStyles.replyDivider} />
                        <Text style={rvStyles.replyText}>"{replyText}"</Text>
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

    // ── State: Just Submitted (No Reply Yet) ────────────────────────────
    if (submitted) {
        return (
            <View style={[rvStyles.card, style]}>
                <View style={rvStyles.thankRow}>
                    <Text style={rvStyles.thankEmoji}>🎉</Text>
                    <Text style={rvStyles.thankTitle}>Review submitted!</Text>
                </View>
                <Text style={rvStyles.thankSub}>The restaurant has been notified.</Text>
            </View>
        );
    }

    // ── State: New Review Form ──────────────────────────────────────────
    return (
        <View style={[rvStyles.card, style]}>
            <Text style={rvStyles.title}>How was your experience?</Text>
            <Text style={rvStyles.sub}>Your feedback helps others make better choices.</Text>

            <View style={rvStyles.starsRow}>
                {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity key={star} onPress={() => handleStarPress(star)} activeOpacity={0.7}>
                        <Animated.View style={{ transform: [{ scale: starAnimations[star - 1] }] }}>
                            <Icon name={star <= selected ? 'star' : 'star-border'}
                                size={40} color={star <= selected ? '#F39C12' : Colors.border} />
                        </Animated.View>
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

const rvStyles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white, borderRadius: 16, padding: 20,
        elevation: 1, shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
        alignItems: 'center', gap: 10,
    },
    title: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
    sub: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
    starsRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
    starsRowSmall: { flexDirection: 'row', gap: 3 },
    starLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
    commentInput: {
        width: '100%', borderWidth: 1, borderColor: Colors.border,
        borderRadius: 12, padding: 12, fontSize: 13,
        color: Colors.textPrimary, minHeight: 80, backgroundColor: '#FAFAFA',
    },
    charCount: { alignSelf: 'flex-end', fontSize: 11, color: Colors.textLight },
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 13, paddingHorizontal: 28,
        borderRadius: 14, marginTop: 4, width: '100%', justifyContent: 'center',
    },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    thankRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    thankEmoji: { fontSize: 28 },
    thankTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
    thankSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
    savedComment: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 8 },
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
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    replyFrom: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 0.2 },
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