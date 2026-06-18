import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency } from '../../utils/formatCurrency';

const CartBarComponent = ({ itemCount, total, restaurantName, onPress }) => {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const slideAnim = useRef(new Animated.Value(120)).current;
  const bumpAnim = useRef(new Animated.Value(1)).current;
  const [visible, setVisible] = useState(false);
  const prevCount = useRef(itemCount);

  useEffect(() => {
    if (itemCount > 0) {
      setVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 120,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [itemCount]);               // ← Watch itemCount directly, not itemCount > 0

  useEffect(() => {
    if (itemCount > 0 && itemCount !== prevCount.current) {
      prevCount.current = itemCount;
      Animated.sequence([
        Animated.timing(bumpAnim, {
          toValue: 1.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(bumpAnim, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [itemCount]);

  const formattedTotal = React.useMemo(
    () => formatCurrency(total),
    [total]
  );

  if (!visible && itemCount === 0) return null;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { transform: [{ translateY: slideAnim }] },
      ]}
      pointerEvents="box-none">
      <TouchableOpacity
        style={styles.bar}
        onPress={onPress}
        delayPressIn={0}
        activeOpacity={0.92}
        pointerEvents="auto">

        {/* Left */}
        <View style={styles.left}>
          <Animated.View
            style={[styles.countBox, { transform: [{ scale: bumpAnim }] }]}>
            <Text style={styles.countNum}>{itemCount}</Text>
          </Animated.View>
          <View style={styles.labelCol}>
            <Text style={styles.itemsLabel}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} added
            </Text>
            {restaurantName ? (
              <Text style={styles.restLabel} numberOfLines={1}>
                {restaurantName}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Right */}
        <View style={styles.right}>
          <View>
            <Text style={styles.totalAmt}>{formattedTotal}</Text>
            <Text style={styles.taxNote}>+ taxes</Text>
          </View>
          <View style={styles.arrowCircle}>
            <Icon name="arrow-forward-ios" size={13} color={Colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = (C) => StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    elevation: 20,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  bar: {
    backgroundColor: C.primary,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingLeft: 8,
    paddingRight: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  countBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: C.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  countNum: {
    color: C.white,
    fontSize: 20,
    fontWeight: '900',
  },
  labelCol: { flex: 1 },
  itemsLabel: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
  },
  restLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    marginTop: 1,
    maxWidth: 160,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  totalAmt: {
    color: C.white,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },
  taxNote: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    textAlign: 'right',
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export const CartBar = React.memo(CartBarComponent);
