import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';

export const RatingStars = ({ rating, totalRatings, size = 'medium' }) => (
  <View style={styles.container}>
    <View style={[styles.badge, size === 'small' && styles.smallBadge]}>
      <Icon name="star" size={size === 'small' ? 12 : 14} color={Colors.white} />
      <Text style={[styles.ratingText, size === 'small' && styles.smallText]}>
        {rating ? Number(rating).toFixed(1) : 'New'}
      </Text>
    </View>
    {totalRatings > 0 && (
      <Text style={styles.totalRatings}>({totalRatings})</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    backgroundColor: Colors.ratingGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 2,
  },
  smallBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 10,
  },
  totalRatings: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
