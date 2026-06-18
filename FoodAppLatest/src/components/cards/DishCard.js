import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../hooks/useTheme';
import { VegNonVegIcon } from '../common/VegNonVegIcon';
import { formatCurrency } from '../../utils/formatCurrency';

const DishCardComponent = ({ dish, quantity = 0, onAdd, onRemove, isRestaurantOpen = true }) => {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const isVeg = dish.dietary_tag?.toLowerCase() === 'veg' ||
    dish.dietary_tag?.toLowerCase() === 'vegan';
  const isBestseller = dish.is_featured === 1 || dish.is_featured === true;
  const imageUri = dish.image_url;

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card}>
      <View style={styles.info}>
        <VegNonVegIcon isVeg={isVeg} size={14} />
        {isBestseller && <Text style={styles.bestseller}>⭐ BESTSELLER</Text>}
        <Text style={styles.name}>{String(dish?.name ?? "")}</Text>
        <Text style={styles.price}>
          {formatCurrency(Number(dish?.base_price ?? dish?.price ?? 0))}
        </Text>
        {typeof dish?.description === "string" && dish.description.length > 0 && (
          <Text style={styles.description} numberOfLines={2}>{dish.description}</Text>
        )}
      </View>

      <View style={styles.imageSection}>
        {typeof imageUri === "string" && imageUri.startsWith("http") ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}

        <View style={styles.addControl}>
          {!isRestaurantOpen ? (
            <View style={styles.closedBtn}>
              <Text style={styles.closedBtnText}>CLOSED</Text>
            </View>
          ) : quantity === 0 ? (
            <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>ADD</Text>
              <Icon name="add" size={14} color={Colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepBtn} onPress={onRemove} activeOpacity={0.8}>
                <Icon name="remove" size={18} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.quantity}>{quantity ?? 0}</Text>
              <TouchableOpacity style={styles.stepBtn} onPress={onAdd} activeOpacity={0.8}>
                <Icon name="add" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
export const DishCard = React.memo(DishCardComponent);

const createStyles = (C) => StyleSheet.create({
  card: { flexDirection: 'row', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: C.divider, gap: 12 },
  info: { flex: 1, gap: 4 },
  bestseller: { fontSize: 10, fontWeight: '700', color: C.bestsellerGold },
  name: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  price: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  description: { fontSize: 12, color: C.textLight, lineHeight: 17, marginTop: 2 },
  imageSection: { alignItems: 'center', gap: 10 },
  image: { width: 110, height: 110, borderRadius: 12, backgroundColor: C.border },
  imagePlaceholder: { backgroundColor: C.divider },
  addControl: { position: 'absolute', bottom: -12 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.primary,
    borderRadius: 8, paddingHorizontal: 20, paddingVertical: 7, gap: 2,
  },
  addBtnText: { color: C.primary, fontSize: 13, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.primary, borderRadius: 8, overflow: 'hidden' },
  stepBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: C.primary },
  quantity: { color: C.white, fontWeight: '700', fontSize: 14, paddingHorizontal: 12 },
  closedBtn: {
    backgroundColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  closedBtnText: {
    color: C.textLight,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});