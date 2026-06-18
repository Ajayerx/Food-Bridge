import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency } from '../../utils/formatCurrency';

const STATUS_COLORS_MAP = {
  Placed: '#22C55E',
  Accepted: '#F59E0B',
  Preparing: '#F39C12',
  'Out for Delivery': '#22C55E',
  Delivered: '#22C55E',
  Cancelled: '#EF4444',
};

export const OrderCard = ({ order, onReorder, onTrack }) => {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.restaurantName}>{order.restaurantName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS_MAP[order.status] || Colors.textLight }]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>
      <Text style={styles.items} numberOfLines={1}>
        {order.items?.map(i => i.name).filter(Boolean).join(', ') || 'Items not available'}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.total}>{formatCurrency(order.total)}</Text>
        <View style={styles.actions}>
          {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
            <TouchableOpacity style={styles.trackBtn} onPress={onTrack}>
              <Text style={styles.trackBtnText}>Track</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.reorderBtn} onPress={onReorder}>
            <Text style={styles.reorderBtnText}>Reorder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const createStyles = (C) => StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  statusText: {
    color: C.white,
    fontSize: 11,
    fontWeight: '600',
  },
  items: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  trackBtn: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },
  reorderBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reorderBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.white,
  },
});
