import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';

const STATUS_COLORS = {
  Placed: Colors.primary,
  Accepted: Colors.secondary,
  Preparing: '#F39C12',
  'Out for Delivery': Colors.primary,
  Delivered: Colors.success,
  Cancelled: Colors.error,
};

export const OrderCard = ({ order, onReorder, onTrack }) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <Text style={styles.restaurantName}>{order.restaurantName}</Text>
      <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] || Colors.textLight }]}>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
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
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  statusText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  items: {
    fontSize: 13,
    color: Colors.textSecondary,
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
    color: Colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  trackBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  reorderBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reorderBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
});
