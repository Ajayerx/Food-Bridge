import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { VegNonVegIcon } from '../common/VegNonVegIcon';
import { formatCurrency } from '../../utils/formatCurrency';

export const CartItemCard = ({ item, onAdd, onRemove }) => {
  const { dish, quantity } = item;

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <VegNonVegIcon isVeg={dish.isVeg} size={12} />
        <Text style={styles.name} numberOfLines={1}>{dish.name}</Text>
        <Text style={styles.price}>{formatCurrency(dish.price)} each</Text>
      </View>
      <View style={styles.right}>
        <View style={styles.stepper}>
          <TouchableOpacity onPress={onRemove} style={styles.stepBtn}>
            <Icon name="remove" size={16} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.qty}>{quantity}</Text>
          <TouchableOpacity onPress={onAdd} style={styles.stepBtn}>
            <Icon name="add" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.total}>{formatCurrency(dish.price * quantity)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: 12,
  },
  left: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  price: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  qty: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  total: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
