import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../hooks/useTheme';

export const RatingStars = ({ rating, totalRatings, size = 'medium' }) => {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return (
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
};

const createStyles = (C) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    backgroundColor: C.ratingGreen,
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
    color: C.white,
    fontSize: 12,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 10,
  },
  totalRatings: {
    color: C.textSecondary,
    fontSize: 12,
  },
});
