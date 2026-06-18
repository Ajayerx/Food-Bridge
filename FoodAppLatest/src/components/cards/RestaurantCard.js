import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { RatingStars } from '../common/RatingStars';
import { OfferTag } from '../common/OfferTag';

export const RestaurantCard = ({ restaurant, onPress }) => {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        <Image
          source={
            typeof restaurant?.cover_image_url === "string" && restaurant.cover_image_url.startsWith("http")
              ? { uri: restaurant.cover_image_url }
              : { uri: 'https://placehold.co/600x320/e2e8f0/94a3b8?text=Restaurant' }
          }
          style={styles.image}
        />
        {restaurant.promoted && (
          <View style={styles.promotedBadge}>
            <Text style={styles.promotedText}>AD</Text>
          </View>
        )}
        {!restaurant.is_open && (
          <View style={styles.closedOverlay}>
            <Text style={styles.closedText}>CLOSED</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
          <RatingStars rating={restaurant.avg_rating} size="small" />
        </View>
        <Text style={styles.cuisines} numberOfLines={1}>
          {Array.isArray(restaurant?.cuisines)
            ? restaurant.cuisines.join(" • ")
            : ""}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>🕐 {restaurant.avg_prep_time_minutes ?? 30} min</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>
            {restaurant.delivery_fee === 0 ? '🚚 Free Delivery' : `🚚 ₹${restaurant.delivery_fee}`}
          </Text>
        </View>

        {restaurant.offer && <OfferTag offer={restaurant.offer} style={styles.offerTag} />}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (C) => StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 160, backgroundColor: C.border },
  promotedBadge: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: C.overlayDark,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  promotedText: { color: C.white, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlayLight,
    justifyContent: 'center', alignItems: 'center',
  },
  closedText: { color: C.white, fontSize: 18, fontWeight: '700', letterSpacing: 2 },
  content: { padding: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '700', color: C.textPrimary, flex: 1, marginRight: 8 },
  cuisines: { fontSize: 13, color: C.textSecondary, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  meta: { fontSize: 12, color: C.textLight },
  dot: { fontSize: 12, color: C.textLight },
  offerTag: { marginTop: 10 },
});