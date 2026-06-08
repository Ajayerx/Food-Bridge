/**
 * components/common/ReviewCard.js
 *
 * Extracted from OrderDetailScreen + OrderTrackingScreen.
 * Previously the same component was copy-pasted in both screens,
 * meaning on the tracking screen you could have TWO 30-second poll
 * timers running at the same time. Now there is one canonical version.
 */
import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, TextInput, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { submitReview, getOrderReview } from '../../services/review/reviewService';

// FIX: poll interval as a named constant so it's easy to tune
const REVIEW_POLL_MS = 30_000;

export const ReviewCard = memo(({ orderId, restaurantId }) => {
    const [selected, setSelected] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [existingReview, setExistingReview] = useState(null);
    const [loadingExisting, setLoadingExisting] = useState(true);
    // FIX: keep poll interval ref so we can clear it on unmount AND on reply
    const pollRef = useRef(null);
    const cancelledRef = useRef(false);

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    useEffect(() => {
        cancelledRef.current = false;

        const fetchReview = async () => {
            try {
                const review = await getOrderReview(orderId);
                if (cancelledRef.current) return;
                if (review) {
                    setExistingReview(review);
                    setSubmitted(true);
                    setSelected(review.rating);
                    // FIX: stop polling once we have a vendor reply — no point continuing
                    if (review.vendor_reply) stopPolling();
                }
            } catch (_) {
                // silent — network hiccup shouldn't crash the screen
            } finally {
                if (!cancelledRef.current) setLoadingExisting(false);
            }
        };

        // Initial fetch
        fetchReview().then(() => {
            // FIX: only start polling AFTER the first fetch completes and ONLY if
            // the component is still mounted and we don't already have a reply
            if (!cancelledRef.current && !pollRef.current) {
                pollRef.current = setInterval(() => {
                    if (!cancelledRef.current) fetchReview();
                }, REVIEW_POLL_MS);
            }
        });

        return () => {
            cancelledRef.current = true;
            stopPolling();
        };
    }, [orderId, stopPolling]);

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
            // Fetch once after submit to get the full review object (including id)
            const review = await getOrderReview(orderId);
            if (review) setExistingReview(review);
            setSubmitted(true);
        } catch (err) {
            const msg =
                err?.response?.data?.error?.message ?? 'Failed to submit review. Please try again.';
            Alert.alert('Error', msg);
        } finally {
            setSubmitting(false);
        }
    }, [orderId, selected, comment, restaurantId]);

    if (loadingExisting) {
        return (
            <View style={styles.card}>
                <ActivityIndicator color={Colors.primary} />
            </View>
        );
    }

    if (submitted && existingReview) {
        return (
            <View style={styles.card}>
                <View style={styles.thankRow}>
                    <Text style={styles.thankEmoji}>🙏</Text>
                    <Text style={styles.thankTitle}>Thanks for your review!</Text>
                </View>
                <View style={styles.starsRowSmall}>
                    {[1, 2, 3, 4, 5].map(s => (
                        <Icon
                            key={s}
                            name={s <= existingReview.rating ? 'star' : 'star-border'}
                            size={22}
                            color={s <= existingReview.rating ? '#F39C12' : Colors.border}
                        />
                    ))}
                </View>
                {!!existingReview.comment && (
                    <Text style={styles.savedComment}>"{existingReview.comment}"</Text>
                )}
                {existingReview.vendor_reply ? (
                    <View style={styles.replyBox}>
                        <View style={styles.replyHeader}>
                            <View style={styles.replyIconCircle}>
                                <Icon name="store" size={13} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.replyFrom}>Restaurant's Response</Text>
                                {existingReview.replied_at && (
                                    <Text style={styles.replyDate}>
                                        {new Date(existingReview.replied_at).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                        })}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.replyDivider} />
                        <Text style={styles.replyText}>"{existingReview.vendor_reply}"</Text>
                    </View>
                ) : (
                    <View style={styles.awaitingBox}>
                        <Icon name="hourglass-empty" size={14} color={Colors.textLight} />
                        <Text style={styles.awaitingReply}>Awaiting restaurant reply</Text>
                    </View>
                )}
            </View>
        );
    }

    if (submitted) {
        return (
            <View style={styles.card}>
                <View style={styles.thankRow}>
                    <Text style={styles.thankEmoji}>🎉</Text>
                    <Text style={styles.thankTitle}>Review submitted!</Text>
                </View>
                <Text style={styles.thankSub}>The restaurant has been notified.</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <Text style={styles.title}>How was your experience?</Text>
            <Text style={styles.sub}>Your feedback helps others make better choices.</Text>
            <View style={styles.starsRow}>
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
                <Text style={styles.starLabel}>
                    {['', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Great 😄', 'Excellent 🤩'][selected]}
                </Text>
            )}
            <TextInput
                style={styles.commentInput}
                placeholder="Share details about your experience (optional)"
                placeholderTextColor="#bbb"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                maxLength={300}
                textAlignVertical="top"
            />
            <Text style={styles.charCount}>{comment.length}/300</Text>
            <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
            >
                {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <>
                        <Icon name="send" size={18} color="#fff" />
                        <Text style={styles.submitText}>Submit Review</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
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
        fontSize: 13,
        color: Colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    replyBox: {
        alignSelf: 'stretch',
        marginTop: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E0EDFF',
        backgroundColor: '#F5F9FF',
        overflow: 'hidden',
    },
    replyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#EAF2FF',
    },
    replyIconCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    replyFrom: { fontSize: 12, fontWeight: '700', color: Colors.primary },
    replyDate: { fontSize: 10, color: '#7aA8D8', marginTop: 1 },
    replyDivider: { height: 1, backgroundColor: '#D8EAFF' },
    replyText: {
        fontSize: 13,
        color: '#2C4A6E',
        fontStyle: 'italic',
        lineHeight: 20,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    awaitingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'stretch',
        marginTop: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: '#FAFAFA',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        borderStyle: 'dashed',
    },
    awaitingReply: { fontSize: 12, color: Colors.textLight, fontStyle: 'italic' },
});