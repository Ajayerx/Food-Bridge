import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { VegNonVegIcon } from '../common/VegNonVegIcon';
import { formatCurrency } from '../../utils/formatCurrency';

const Stepper = React.memo(({ quantity, onAdd, onRemove }) => (
  <View style={styles.stepper}>
    <TouchableOpacity style={styles.stepBtn} onPress={onRemove} activeOpacity={0.8}>
      <Icon name="remove" size={18} color={Colors.white} />
    </TouchableOpacity>
    <Text style={styles.quantity}>{quantity ?? 0}</Text>
    <TouchableOpacity style={styles.stepBtn} onPress={onAdd} activeOpacity={0.8}>
      <Icon name="add" size={18} color={Colors.white} />
    </TouchableOpacity>
  </View>
));

// Add isRestaurantOpen prop
const DishCardComponent = ({ dish, quantity = 0, onAdd, onRemove, isRestaurantOpen = true }) => {
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
          {/* ✅ Show "CLOSED" instead of ADD when restaurant is closed */}
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
            <Stepper quantity={quantity} onAdd={onAdd} onRemove={onRemove} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
export const DishCard = React.memo(DishCardComponent);

const styles = StyleSheet.create({
  card: { flexDirection: 'row', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: Colors.divider, gap: 12 },
  info: { flex: 1, gap: 4 },
  bestseller: { fontSize: 10, fontWeight: '700', color: '#D4A017' },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  price: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  description: { fontSize: 12, color: Colors.textLight, lineHeight: 17, marginTop: 2 },
  imageSection: { alignItems: 'center', gap: 10 },
  image: { width: 110, height: 110, borderRadius: 12, backgroundColor: Colors.border },
  imagePlaceholder: { backgroundColor: Colors.divider },
  addControl: { position: 'absolute', bottom: -12 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: 8, paddingHorizontal: 20, paddingVertical: 7, gap: 2,
  },
  addBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 8, overflow: 'hidden' },
  stepBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: Colors.primary },
  quantity: { color: Colors.white, fontWeight: '700', fontSize: 14, paddingHorizontal: 12 },
  closedBtn: {
    backgroundColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  closedBtnText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});