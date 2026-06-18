import Geolocation from "react-native-geolocation-service";
import { PermissionsAndroid, Platform } from "react-native";
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { getRestaurantById, getMenuByRestaurantId } from '../../services/restaurant/restaurantService';

import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  RefreshControl,
  Animated,
  Dimensions,
  StatusBar,
  Image,
  PanResponder,
  Easing,
} from 'react-native';
import { useAddressStore } from "../../store/addressStore";
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { RestaurantCard } from '../../components/cards/RestaurantCard';
import { Chip } from '../../components/common/Chip';
import { EmptyState } from '../../components/common/EmptyState';
import { useRestaurants } from '../../hooks/useRestaurants';
import { useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '../../store/userStore';
import { useCart } from '../../hooks/useCart';
import { FILTER_CHIPS, CATEGORIES } from '../../constants/categories';
import api from '../../services/api/base';
import { useNotificationStore } from '../../store/notificationStore';
import { reverseGeocode } from '../../services/geocodingService';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 32;

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
const BANNERS = [
  { id: 'b1', title: '50% OFF', subtitle: 'On your first order', cta: 'Order Now', emoji: '🎉', tag: 'LIMITED TIME', colors: ['#FF6B35', '#FF8C42', '#FFA55A'] },
  { id: 'b2', title: 'Free Delivery', subtitle: 'On orders above ₹299', cta: 'Explore', emoji: '🛵', tag: 'TODAY ONLY', colors: ['#6C63FF', '#8B80FF', '#A99DF5'] },
  { id: 'b3', title: '2X Rewards', subtitle: 'Earn double points today', cta: 'Claim Now', emoji: '⭐', tag: 'EXCLUSIVE', colors: ['#11998E', '#38EF7D', '#2DC653'] },
  { id: 'b4', title: 'New Arrivals', subtitle: 'Try 20+ new restaurants', cta: 'Discover', emoji: '✨', tag: 'NEW', colors: ['#F857A6', '#FF5858', '#FF8C42'] },
];

// Clone last at start + clone first at end for seamless infinite loop
const EXTENDED_BANNERS = [BANNERS[BANNERS.length - 1], ...BANNERS, BANNERS[0]];

const CAT_GRADIENTS = [
  ['#FFF3E0', '#FFE0B2'], ['#FCE4EC', '#F8BBD0'], ['#E8F5E9', '#C8E6C9'],
  ['#E3F2FD', '#BBDEFB'], ['#F3E5F5', '#E1BEE7'], ['#FFF8E1', '#FFECB3'],
  ['#E0F7FA', '#B2EBF2'], ['#FBE9E7', '#FFCCBC'],
];

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance', icon: 'sort' },
  { id: 'rating', label: 'Rating (High to Low)', icon: 'star' },
  { id: 'delivery_time', label: 'Delivery Time', icon: 'access-time' },
  { id: 'price_low', label: 'Cost: Low to High', icon: 'trending-up' },
  { id: 'price_high', label: 'Cost: High to Low', icon: 'trending-down' },
];



const sortRestaurants = (restaurants, sortId) => {
  if (!restaurants) return [];
  const arr = [...restaurants];
  switch (sortId) {
    case 'rating': return arr.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
    case 'delivery_time': return arr.sort((a, b) => (a.avg_delivery_minutes ?? 0) - (b.avg_delivery_minutes ?? 0));
    case 'price_low': return arr.sort((a, b) => (a.average_cost ?? 0) - (b.average_cost ?? 0));
    case 'price_high': return arr.sort((a, b) => (b.average_cost ?? 0) - (a.average_cost ?? 0));
    default: return arr;
  }
};

// ─────────────────────────────────────────────────────────
// SkeletonCard
// ─────────────────────────────────────────────────────────
const SkeletonCard = () => {
  const C = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true, isInteraction: false }),
      Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true, isInteraction: false }),
    ]));
    loop.start();
    return () => shimmer.stopAnimation();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.85] });
  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonImg} />
      <View style={styles.skeletonBody}>
        <View style={[styles.skeletonLine, { width: '65%', height: 15 }]} />
        <View style={[styles.skeletonLine, { width: '45%', height: 11 }]} />
        <View style={[styles.skeletonLine, { width: '80%', height: 11 }]} />
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────
// DishSkeleton
// ─────────────────────────────────────────────────────────
const DishSkeleton = () => {
  const C = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true, isInteraction: false }),
      Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true, isInteraction: false }),
    ]));
    loop.start();
    return () => shimmer.stopAnimation();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.85] });
  return (
    <Animated.View style={[styles.dishSkeletonCard, { opacity }]}>
      <View style={styles.dishSkeletonImg} />
      <View style={[styles.dishSkeletonLine, { width: '80%' }]} />
      <View style={[styles.dishSkeletonLine, { width: '50%' }]} />
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────
// BannerCard — static, no per-card animations
// ─────────────────────────────────────────────────────────
const BannerCard = React.memo(({ item }) => {
  const C = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  return (
    <View style={styles.bannerOuter}>
      <LinearGradient colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bannerGradient}>
        <View style={styles.bannerHighlight} />
        <View style={styles.bannerCircle1} />
        <View style={styles.bannerCircle2} />
        <View style={styles.bannerCircle3} />
        <View style={styles.bannerTag}>
          <View style={styles.bannerTagDot} />
          <Text style={styles.bannerTagText}>{item.tag}</Text>
        </View>
        <View style={styles.bannerContent}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerTitle}>{item.title}</Text>
            <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
            <View style={styles.bannerCtaBtn}>
              <Text style={styles.bannerCtaText}>{item.cta}</Text>
              <Icon name="arrow-forward-ios" size={11} color={C.textPrimary} />
            </View>
          </View>
          <View style={styles.bannerEmojiContainer}>
            <Text style={styles.bannerEmoji}>{item.emoji}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// BannerSection — seamless infinite loop via translateX
// No FlatList, no flicker. One slide animation for all.
// ─────────────────────────────────────────────────────────
const BannerSection = React.memo(() => {
    const C = useTheme();
    const styles = useMemo(() => createStyles(C), [C]);
    const ITEM_WIDTH = BANNER_WIDTH + 16;
  const START = 1; // first real banner index in EXTENDED_BANNERS

  const translateX = useRef(new Animated.Value(-ITEM_WIDTH * START)).current;
  const currentIdx = useRef(START);
  const isAnimating = useRef(false);

  // Slide to a target index with smooth animation
  const slideTo = useCallback((targetIdx) => {
    currentIdx.current = targetIdx;
    isAnimating.current = true;
    Animated.timing(translateX, {
      toValue: -ITEM_WIDTH * targetIdx,
      duration: 480,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start(({ finished }) => {
      isAnimating.current = false;
      if (!finished) return;

      // Seamless reset: jump from clone to the real equivalent
      // Clone of first banner (last index) → jump to real first (index 1)
      if (targetIdx >= EXTENDED_BANNERS.length - 1) {
        currentIdx.current = START;
        translateX.setValue(-ITEM_WIDTH * START);
      }
      // Clone of last banner (index 0) → jump to real last
      else if (targetIdx <= 0) {
        currentIdx.current = BANNERS.length; // last real banner
        translateX.setValue(-ITEM_WIDTH * BANNERS.length);
      }
    });
  }, []);

  // Auto-scroll
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating.current) {
        slideTo(currentIdx.current + 1);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [slideTo]);

  // Swipe gesture handling
  const gestureRef = useRef({ startOffset: 0 });
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gs) =>
      Math.abs(gs.dx) > 12 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      translateX.stopAnimation();
      isAnimating.current = false;
      gestureRef.current.startOffset = -ITEM_WIDTH * currentIdx.current;
    },
    onPanResponderMove: (_, gs) => {
      translateX.setValue(gestureRef.current.startOffset + gs.dx);
    },
    onPanResponderRelease: (_, gs) => {
      const dx = gs.dx;
      const vx = gs.vx;
      let targetIdx = currentIdx.current;

      if (Math.abs(dx) > ITEM_WIDTH * 0.25 || Math.abs(vx) > 0.4) {
        targetIdx = dx > 0 ? currentIdx.current - 1 : currentIdx.current + 1;
      }

      // Clamp within extended bounds
      targetIdx = Math.max(0, Math.min(EXTENDED_BANNERS.length - 1, targetIdx));
      slideTo(targetIdx);
    },
  }), []);

  return (
    <View style={styles.bannerContainer}>
      <Animated.View
        style={[styles.bannerTrack, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {EXTENDED_BANNERS.map((item, index) => (
          <BannerCard key={index} item={item} />
        ))}
      </Animated.View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// CategoryCard
// ─────────────────────────────────────────────────────────
const CategoryCard = React.memo(({ item, index, onPress }) => {
    const C = useTheme();
    const styles = useMemo(() => createStyles(C), [C]);
    const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
      activeOpacity={1}>
      <Animated.View style={[styles.catCard, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient colors={CAT_GRADIENTS[index % CAT_GRADIENTS.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.catGradient}>
          <Text style={styles.catEmoji}>{item.emoji}</Text>
        </LinearGradient>
        <Text style={styles.catName}>{item.name}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

// ─────────────────────────────────────────────────────────
// HomeDishCard
// ─────────────────────────────────────────────────────────
const HomeDishCard = React.memo(({ item, quantity, onAdd, onRemove, onPress }) => {
    const C = useTheme();
    const styles = useMemo(() => createStyles(C), [C]);
    const isVeg = item?.dietary_tag?.toLowerCase() === 'veg' ||
      item?.dietary_tag?.toLowerCase() === 'vegan';
  const price = Number(item?.base_price ?? item?.price ?? 0);
  const originalPrice = item?.original_price ?? item?.mrp ?? null;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <View style={styles.homeDishCard}>
        <View style={styles.homeDishImgBox}>
          {item?.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.homeDishImg} resizeMode="cover" />
          ) : (
            <View style={[styles.homeDishImgBox, styles.homeDishPlaceholder]}>
              <Text style={{ fontSize: 32 }}>🍽️</Text>
            </View>
          )}

          <View style={[styles.vegBadgeSmall, { borderColor: isVeg ? C.vegGreen : C.nonVegRed }]}>
            <View style={[styles.vegDotSmall, { backgroundColor: isVeg ? C.vegGreen : C.nonVegRed }]} />
          </View>
        </View>
        <View style={styles.homeDishInfo}>
          <Text numberOfLines={1} style={styles.homeDishName}>{item?.name}</Text>
          <View style={styles.priceRow}>
            {originalPrice ? <Text style={styles.originalPrice}>₹{originalPrice}</Text> : null}
            <Text style={styles.homeDishPrice}>₹{price}</Text>
          </View>
          <Text numberOfLines={2} style={styles.homeDishDesc}>
            {item?.description || 'Freshly prepared delicious dish.'}
          </Text>
          {quantity === 0 ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={(e) => { e.stopPropagation?.(); onAdd(); }}
              activeOpacity={0.85}
            >
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.stepperFilled}>
              <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onRemove(); }} style={styles.stepperTouchable}>
                <Text style={styles.stepperBtnFilled}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperCountFilled}>{quantity}</Text>
              <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onAdd(); }} style={styles.stepperTouchable}>
                <Text style={styles.stepperBtnFilled}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─────────────────────────────────────────────────────────
// PopularDishesSection
// ─────────────────────────────────────────────────────────
const PopularDishesSection = React.memo(({ onDishPress, onAdd, onRemove, getQuantity }) => {
    const C = useTheme();
    const styles = useMemo(() => createStyles(C), [C]);
    const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/menu-items/popular', { params: { limit: 10 } })
      .then(res => { if (!cancelled) setDishes(res.data?.data ?? []); })
      .catch(() => { if (!cancelled) setDishes([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (!loading && dishes.length === 0) return null;

  return (
    <View style={styles.dishSection}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>Popular Dishes 🔥</Text>
          <Text style={styles.sectionSubtitle}>Trending near you</Text>
        </View>
        <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dishesContent}>
        {loading
          ? [1, 2, 3, 4].map(k => <DishSkeleton key={k} />)
          : dishes.map(dish => (
            <HomeDishCard
              key={dish.id}
              item={dish}
              quantity={getQuantity(dish.id)}
              onAdd={() => onAdd(dish)}
              onRemove={() => onRemove(dish.id)}
              onPress={() => onDishPress(dish)}
            />
          ))
        }
      </ScrollView>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// AnimatedRestaurantCard
// ─────────────────────────────────────────────────────────
const AnimatedRestaurantCard = React.memo(({ item, index, onPress }) => {
  const C = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false); // ✅ only animate once

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 350,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{
      opacity: cardAnim,
      transform: [{
        translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] })
      }]
    }}>
      <RestaurantCard restaurant={item} onPress={onPress} />
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────
// SortBottomSheet
// ─────────────────────────────────────────────────────────
const SortBottomSheet = React.memo(({ visible, onClose, activeSort, onSelectSort }) => {
  const C = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);
  if (!visible) return null;
  return (
    <>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.sortOverlay, { opacity: overlayAnim }]} />
      </TouchableWithoutFeedback>
      <Animated.View style={[styles.sortSheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sortHandle} />
        <Text style={styles.sortSheetTitle}>Sort By</Text>
        {SORT_OPTIONS.map(option => {
          const isActive = activeSort === option.id;
          return (
            <TouchableOpacity key={option.id} style={[styles.sortOption, isActive && styles.sortOptionActive]} onPress={() => { onSelectSort(option.id); onClose(); }} activeOpacity={0.75}>
              <View style={[styles.sortOptionIcon, isActive && styles.sortOptionIconActive]}>
                <Icon name={option.icon} size={16} color={isActive ? C.primary : C.textSecondary} />
              </View>
              <Text style={[styles.sortOptionText, isActive && styles.sortOptionTextActive]}>{option.label}</Text>
              {isActive && <Icon name="check-circle" size={18} color={C.primary} />}
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </>
  );
});

// ─────────────────────────────────────────────────────────
// HomeListHeader
// ─────────────────────────────────────────────────────────
const HomeListHeader = React.memo(({
    activeFilters, onToggleFilter, onClearFilters,
    restaurantCount, navigation, fadeAnims, activeSort,
    onOpenSort, onDishPress, onDishAdd, onDishRemove, getQuantity,
  }) => {
    const C = useTheme();
    const styles = useMemo(() => createStyles(C), [C]);
    const { bannerFade, filterFade, catFade, restFade } = fadeAnims;
  return (
    <View>
      <Animated.View style={{ opacity: bannerFade }}>
        <BannerSection />
      </Animated.View>
      <Animated.View style={{ opacity: filterFade }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={styles.filtersContent}>
          {FILTER_CHIPS.map(chip => (
            <Chip key={chip.id} label={chip.label} active={activeFilters.includes(chip.id)} onPress={() => onToggleFilter(chip.id)} />
          ))}
          {activeFilters.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={onClearFilters}>
              <Icon name="close" size={12} color={C.error} />
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </Animated.View>
      <Animated.View style={{ opacity: catFade }}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionTitle}>What's on your mind?</Text>
            <View style={styles.sectionAccentLine} />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('SearchScreen', {})}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsContent}>
          {CATEGORIES.map((cat, i) => (
            <CategoryCard key={cat.id} item={cat} index={i} onPress={() => navigation.navigate('SearchScreen', { query: cat.name, autoFill: true })} />
          ))}
        </ScrollView>
      </Animated.View>
      <Animated.View style={{ opacity: catFade }}>
        <PopularDishesSection onDishPress={onDishPress} onAdd={onDishAdd} onRemove={onDishRemove} getQuantity={getQuantity} />
      </Animated.View>
      <Animated.View style={[styles.restHeaderRow, { opacity: restFade }]}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>{activeFilters.length > 0 ? `Filtered (${restaurantCount})` : 'All Restaurants'}</Text>
          <Text style={styles.restSubtitle}>{restaurantCount} places near you</Text>
        </View>
        <TouchableOpacity style={styles.sortBtn} onPress={onOpenSort}>
          <Icon name="tune" size={14} color={C.primary} />
          <Text style={styles.sortText}>Sort</Text>
          {activeSort !== 'relevance' && <View style={styles.sortActiveDot} />}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// DishBottomModal
// ─────────────────────────────────────────────────────────
const DishBottomModal = ({ visible, dish, onClose, onAdd, navigation }) => {
    const C = useTheme();
    const styles = useMemo(() => createStyles(C), [C]);
    const slideAnim = useRef(new Animated.Value(500)).current;
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 500, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!dish) return null;

  const isVeg = dish?.dietary_tag?.toLowerCase() === 'veg' ||
    dish?.dietary_tag?.toLowerCase() === 'vegan';
  const price = Number(dish?.base_price ?? dish?.price ?? 0);
  const originalPrice = dish?.original_price ?? dish?.mrp ?? null;

  const handleAdd = () => {
    onAdd();
    onClose();
    navigation.navigate('CartScreen');
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.dishModalContainer}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.dishModalOverlay} />
        </TouchableWithoutFeedback>
        <Animated.View style={[styles.dishModalSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.dishModalImgBox}>
            {dish?.image_url ? (
              <Image source={{ uri: dish.image_url }} style={styles.dishModalImg} resizeMode="cover" />
            ) : (
              <View style={[styles.dishModalImg, styles.dishModalImgPlaceholder]}>
                <Text style={{ fontSize: 64 }}>🍽️</Text>
              </View>
            )}

          </View>
          <View style={styles.dishModalContent}>
            <View style={[styles.vegIndicator, { borderColor: isVeg ? C.vegGreen : C.nonVegRed }]}>
              <View style={[styles.vegDot, { backgroundColor: isVeg ? C.vegGreen : C.nonVegRed }]} />
            </View>
            <Text style={styles.dishModalTitle}>{dish?.name}</Text>
            <View style={styles.priceRow}>
              {originalPrice ? <Text style={styles.originalPrice}>₹{originalPrice}</Text> : null}
              <Text style={styles.dishModalPrice}>₹{price}</Text>
            </View>
            <Text style={[styles.dishModalDesc, { marginTop: 6, marginBottom: 16 }]}>
              {dish?.description || 'Delicious and freshly prepared dish.'}
            </Text>
            <TouchableOpacity style={styles.dishModalAddBtnFull} onPress={handleAdd} activeOpacity={0.88}>
              <Text style={styles.dishModalAddTextFull}>ADD TO CART</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.dishModalCloseBtnCenter} onPress={onClose}>
            <Icon name="close" size={20} color={C.white} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────
// CartConflictModal
// ─────────────────────────────────────────────────────────
const CartConflictModal = ({ visible, currentRestaurantName, newRestaurantName, onCancel, onReplace }) => {
  const C = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.conflictOverlay} activeOpacity={1} onPress={onCancel}>
        <TouchableOpacity style={styles.conflictSheet} activeOpacity={1} onPress={() => { }}>
          <TouchableOpacity style={styles.conflictClose} onPress={onCancel}>
            <Icon name="close" size={20} color={C.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.conflictTitle}>Replace cart item?</Text>
          <Text style={styles.conflictMessage}>
            Your cart contains dishes from{' '}
            <Text style={styles.conflictRestName}>{currentRestaurantName}</Text>
            {'. Do you want to discard the selection and add dishes from '}
            <Text style={styles.conflictRestName}>{newRestaurantName}</Text>{'?'}
          </Text>
          <View style={styles.conflictBtns}>
            <TouchableOpacity style={styles.conflictBtnNo} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.conflictBtnNoText}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.conflictBtnReplace} onPress={onReplace} activeOpacity={0.85}>
              <Text style={styles.conflictBtnReplaceText}>Replace</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────
// HomeScreen
// ─────────────────────────────────────────────────────────
export const HomeScreen = ({ navigation }) => {
  const C = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const [activeSort, setActiveSort] = useState('relevance');
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [dishModalVisible, setDishModalVisible] = useState(false);
  const [conflictModal, setConflictModal] = useState(false);
  const [pendingDish, setPendingDish] = useState(null);

  const {
    addItem,
    replaceCartAndAdd,
    removeItem,
    itemCount,
    restaurantName: cartRestaurantName,
    getQuantityForItem,
  } = useCart();

  const handleAddDish = useCallback((dish) => {
    const dishRestaurantId = dish?.restaurant_id ?? dish?.restaurantId ?? null;
    const dishRestaurantName = dish?.restaurant_name ?? dish?.restaurantName ?? 'Restaurant';
    const result = addItem(dish, dishRestaurantId, dishRestaurantName);
    if (result === 'CONFLICT') {
      setPendingDish(dish);
      setConflictModal(true);
    }
  }, [addItem]);

  const handleRemoveDish = useCallback((dishId) => removeItem(dishId), [removeItem]);

  const handleConfirmReplace = useCallback(() => {
    if (pendingDish) {
      const dishRestaurantId = pendingDish?.restaurant_id ?? pendingDish?.restaurantId ?? null;
      const dishRestaurantName = pendingDish?.restaurant_name ?? pendingDish?.restaurantName ?? 'Restaurant';
      replaceCartAndAdd(pendingDish, dishRestaurantId, dishRestaurantName);
    }
    setConflictModal(false);
    setPendingDish(null);
    setDishModalVisible(false);
    setSelectedDish(null);
  }, [pendingDish, replaceCartAndAdd]);

  const handleCancelReplace = useCallback(() => {
    setConflictModal(false);
    setPendingDish(null);
  }, []);

  const openDishModal = useCallback((dish) => {
    setSelectedDish(dish);
    setDishModalVisible(true);
  }, []);

  const closeDishModal = useCallback(() => {
    setDishModalVisible(false);
    setSelectedDish(null);
  }, []);

  const handleModalAdd = useCallback(() => {
    if (selectedDish) handleAddDish(selectedDish);
  }, [selectedDish, handleAddDish]);

  // ── Address ────────────────────────────────────────────
  const selectedAddress = useAddressStore(s => s.selectedAddress);
  const fetchAddresses = useAddressStore(s => s.fetchAddresses);

  useEffect(() => { fetchAddresses(); }, []);

  const [activeFilters, setActiveFilters] = useState([]);
  const queryClient = useQueryClient();
  const user = useUserStore(s => s.user);
  const darkMode = useUserStore(s => s.darkMode);
  const badgeCount = useNotificationStore(s => s.badgeCount);
  const scrollY = useRef(new Animated.Value(0)).current;

  const filters = useMemo(() =>
    activeFilters.reduce((acc, f) => ({ ...acc, [f]: true }), {}),
    [activeFilters]
  );

  const { data: restaurants, isLoading, refetch, isRefetching } = useRestaurants(filters);

  const sortedRestaurants = useMemo(() =>
    sortRestaurants(restaurants, activeSort),
    [restaurants, activeSort]
  );

  const bannerFade = useRef(new Animated.Value(0)).current;
  const filterFade = useRef(new Animated.Value(0)).current;
  const catFade = useRef(new Animated.Value(0)).current;
  const restFade = useRef(new Animated.Value(0)).current;
  const fadeAnims = useRef({ bannerFade, filterFade, catFade, restFade }).current;

  useEffect(() => {
    if (!isLoading && restaurants?.length >= 0) {
      Animated.stagger(100, [
        Animated.timing(bannerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(filterFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(catFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(restFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [isLoading]);

  const greetingOpacity = scrollY.interpolate({ inputRange: [0, 60], outputRange: [1, 0], extrapolate: 'clamp' });
  const topBarElevation = scrollY.interpolate({ inputRange: [0, 60], outputRange: [0, 8], extrapolate: 'clamp' });

  const toggleFilter = useCallback(id => {
    setActiveFilters(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }, []);
  const clearFilters = useCallback(() => setActiveFilters([]), []);

  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const fetchAddress = async (latitude, longitude) => {
    try {
      const data = await reverseGeocode(latitude, longitude);
      if (!data) return;
      const fullAddress = [data.addressLine1, data.addressLine2, data.city, data.state, data.pinCode]
        .filter(Boolean).join(', ');
      setSelectedAddress({
        label: "Current Location",
        address: fullAddress || "Unknown address",
        city: data.city || "Unknown",
        state: data.state || "",
        latitude,
        longitude,
      });
    } catch (error) { console.log("Address fetch error", error?.message || error); }
  };

  const restaurantCount = sortedRestaurants?.length ?? 0;

  const openRestaurant = useCallback(async (restaurant) => {
    const restaurantId = restaurant.id;
    try {
      await Promise.all([
        queryClient.prefetchQuery({ queryKey: ["restaurantDetail", restaurantId], queryFn: () => getRestaurantById(restaurantId) }),
        queryClient.prefetchQuery({ queryKey: ["restaurantMenu", restaurantId], queryFn: () => getMenuByRestaurantId(restaurantId) }),
      ]);
    } catch (e) { }
    navigation.navigate("RestaurantDetailScreen", { restaurantId });
  }, [queryClient, navigation]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <AnimatedRestaurantCard item={item} index={index} onPress={() => openRestaurant(item)} />
    ),
    [openRestaurant],
  );

  // ✅ Memoized — only re-renders when these deps change, not on every render
  const listHeaderComponent = useMemo(() => (
    <HomeListHeader
      activeFilters={activeFilters}
      onToggleFilter={toggleFilter}
      onClearFilters={clearFilters}
      restaurantCount={restaurantCount}
      navigation={navigation}
      fadeAnims={fadeAnims}
      activeSort={activeSort}
      onOpenSort={() => setSortSheetVisible(true)}
      onDishPress={openDishModal}
      onDishAdd={handleAddDish}
      onDishRemove={handleRemoveDish}
      getQuantity={getQuantityForItem}
    />
  ), [activeFilters, restaurantCount, activeSort, toggleFilter, clearFilters,
    openDishModal, handleAddDish, handleRemoveDish, getQuantityForItem]);

  const pendingRestaurantName = pendingDish?.restaurant_name ?? pendingDish?.restaurantName ?? 'this restaurant';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={C.surface} barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Top Bar */}
      <Animated.View style={[styles.topBar, { elevation: topBarElevation }]}>
        <Animated.View style={{ opacity: greetingOpacity, overflow: 'hidden' }}>
          <Text style={styles.greeting}>Hey {user?.full_name?.split(' ')[0] ?? 'Foodie'} 👋, hungry?</Text>
        </Animated.View>
        <View style={styles.locationCartRow}>
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={() => navigation.navigate('LocationSelectScreen')}
            activeOpacity={0.7}
          >
            <Icon name="location-on" size={20} color={C.primary} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.locationCityText} numberOfLines={1}>
                  {selectedAddress?.city || "Select Location"}
                </Text>
                <Icon name="keyboard-arrow-down" size={18} color={C.textPrimary} />
              </View>
              {selectedAddress ? (
                <Text style={styles.locationAddressText} numberOfLines={1}>
                  {[selectedAddress.address_line1, selectedAddress.city, selectedAddress.pin_code]
                    .filter(Boolean).join(', ')}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
          <View style={styles.topBarActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('NotificationsScreen', { userId: user?.user_id })}>
              <Icon name="notifications-none" size={22} color={C.textPrimary} />
              {badgeCount > 0 && <View style={styles.notifDot} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('CartScreen')}>
              <Icon name="shopping-cart" size={22} color={C.textPrimary} />
              {itemCount > 0 && (
                <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{itemCount}</Text></View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('SearchScreen')} activeOpacity={0.8}>
          <View style={styles.searchLeft}>
            <Icon name="search" size={20} color={C.textSecondary} />
            <Text style={styles.searchText}>Search restaurants & dishes...</Text>
          </View>
          <View style={styles.micBtn}><Icon name="mic" size={16} color={C.white} /></View>
        </TouchableOpacity>
      </Animated.View>

      {/* ✅ Content — restaurant FlatList (NOT banner FlatList) */}
      {isLoading ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.skeletonContainer}>
          {listHeaderComponent}
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </ScrollView>
      ) : (
        <Animated.FlatList
          data={sortedRestaurants}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListHeaderComponent={listHeaderComponent}
          contentContainerStyle={styles.listContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[C.primary]}
              tintColor={C.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              emoji="🍽️"
              title="No restaurants found"
              subtitle="Try removing some filters"
              buttonTitle="Clear Filters"
              onButtonPress={clearFilters}
            />
          }
        />
      )}

      {/* Sort Bottom Sheet */}
      <SortBottomSheet
        visible={sortSheetVisible}
        onClose={() => setSortSheetVisible(false)}
        activeSort={activeSort}
        onSelectSort={setActiveSort}
      />

      {/* Dish Bottom Modal */}
      <DishBottomModal
        visible={dishModalVisible}
        dish={selectedDish}
        onClose={closeDishModal}
        onAdd={handleModalAdd}
        navigation={navigation}
      />

      {/* Cart Conflict Modal */}
      <CartConflictModal
        visible={conflictModal}
        currentRestaurantName={cartRestaurantName}
        newRestaurantName={pendingRestaurantName}
        onCancel={handleCancelReplace}
        onReplace={handleConfirmReplace}
      />
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const createStyles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },

  // ── Top Bar ──
  topBar: {
    backgroundColor: C.surface,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
    overflow: 'visible',
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    zIndex: 10,
  },
  greeting: {
    fontSize: 13,
    color: C.textPrimary,
    fontWeight: '600',
    paddingTop: 4,
    letterSpacing: 0.2,
  },
  locationCartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  locationCityText: {
    fontSize: 15,
    fontWeight: '800',
    color: C.textPrimary,
    maxWidth: 170,
  },
  locationAddressText: {
    fontSize: 11,
    color: C.textSecondary,
    maxWidth: 170,
  },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: C.cardBg,
    borderWidth: 1.5,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.error,
    borderWidth: 1.5,
    borderColor: C.white,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: C.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: C.white,
  },
  cartBadgeText: { color: C.white, fontSize: 9, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.inputBg,
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    // ✨ Enhanced shadow for depth
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  searchText: { fontSize: 14, color: C.textLight },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Banners ──
  bannerContainer: {
    marginHorizontal: -16,   // Extend to full screen width (counteract parent paddingHorizontal)
    overflow: 'hidden',
  },
  bannerTrack: {
    flexDirection: 'row',
    paddingHorizontal: 16,   // Padding on the track so first/last banner sit 16px from screen edge
    paddingVertical: 16,     // Even vertical padding — same top and bottom
  },
  bannerOuter: {
    width: BANNER_WIDTH,
    borderRadius: 20,
    marginRight: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  bannerGradient: {
    width: '100%',
    padding: 18,
    borderRadius: 20,
    minHeight: 140,
    overflow: 'hidden',
  },
  bannerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bannerCircle1: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(255,255,255,0.1)', top: -70, right: -30 },
  bannerCircle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)', bottom: -40, right: 70 },
  bannerCircle3: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.1)', top: 20, right: 120 },
  bannerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 10,
  },
  bannerTagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.white },
  bannerTagText: { fontSize: 9, fontWeight: '800', color: C.white, letterSpacing: 1 },
  bannerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerLeft: { flex: 1, gap: 5 },
  bannerTitle: { fontSize: 24, fontWeight: '900', color: C.white, letterSpacing: -0.5 },
  bannerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.88)', fontWeight: '500' },
  bannerCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
    elevation: 3,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bannerCtaText: { fontSize: 12, fontWeight: '800', color: C.white },
  bannerEmoji: { fontSize: 48, lineHeight: 52 },
  bannerEmojiContainer: { width: 70, alignItems: 'center', justifyContent: 'center' },

  // ── Filters ──
  filtersRow: { flexGrow: 0, marginVertical: 10 },
  filtersContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: C.errorBorder,
  },
  clearBtnText: { fontSize: 12, color: C.error, fontWeight: '600' },

  // ── Section Headers ──
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 6,
  },
  sectionHeaderLeft: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 1,
  },
  sectionAccentLine: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.primary,
    marginTop: 2,
  },
  seeAll: { fontSize: 13, color: C.primary, fontWeight: '700' },

  // ── Categories ──
  catsContent: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  catCard: { width: 76, alignItems: 'center', gap: 7 },
  catGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  catEmoji: { fontSize: 28 },
  catName: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textPrimary,
    textAlign: 'center',
  },

  // ── Dishes ──
  dishSection: { marginTop: 8, marginBottom: 4 },
  dishesContent: { paddingHorizontal: 16, gap: 12, paddingBottom: 8, paddingTop: 4 },
  homeDishCard: {
    width: 160,
    borderRadius: 20,
    backgroundColor: C.surface,
    marginRight: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  homeDishImgBox: {
    height: 115,
    position: 'relative',
    overflow: 'hidden',
  },
  homeDishImg: { width: '100%', height: '100%' },
  homeDishPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },
  vegBadgeSmall: {
    position: 'absolute',
    top: 7,
    left: 7,
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.white,
  },
  vegDotSmall: { width: 8, height: 8, borderRadius: 4 },
  homeDishInfo: { padding: 10, gap: 2 },
  homeDishName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: 0.1,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  originalPrice: { fontSize: 11, color: C.textLight, textDecorationLine: 'line-through' },
  homeDishPrice: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  homeDishDesc: { fontSize: 11, color: C.textSecondary, lineHeight: 15, marginTop: 2 },
  addBtn: {
    borderWidth: 1.5,
    borderColor: C.primary,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
    // ✨ Enhanced ADD button
    backgroundColor: C.primaryLight + '30',
  },
  addBtnText: {
    color: C.primary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  stepperFilled: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginTop: 6,
  },
  stepperTouchable: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  stepperBtnFilled: {
    fontSize: 18,
    color: C.white,
    fontWeight: 'bold',
  },
  stepperCountFilled: {
    fontWeight: '700',
    color: C.white,
    fontSize: 13,
    minWidth: 20,
    textAlign: 'center',
  },

  // ── Dish Skeleton ──
  dishSkeletonCard: {
    width: 160,
    backgroundColor: C.white,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
    marginRight: 12,
  },
  dishSkeletonImg: { width: '100%', height: 115, backgroundColor: C.border },
  dishSkeletonLine: { height: 11, backgroundColor: C.border, borderRadius: 6, margin: 10, marginBottom: 5 },

  // ── Restaurant Header ──
  restHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
  },
  restSubtitle: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.primary + '33',
    position: 'relative',
    elevation: 2,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sortText: { fontSize: 12, fontWeight: '700', color: C.primary },
  sortActiveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.primary, position: 'absolute', top: -2, right: -2 },

  // ── List Content ──
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  skeletonContainer: { paddingHorizontal: 16, paddingBottom: 32 },
  skeletonCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
  },
  skeletonImg: { width: '100%', height: 150, backgroundColor: C.border },
  skeletonBody: { padding: 14, gap: 10 },
  skeletonLine: { backgroundColor: C.border, borderRadius: 6 },

  // ── Sort Bottom Sheet ──
  sortOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: C.overlayMedium, zIndex: 200 },
  sortSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 300,
    elevation: 20,
    paddingBottom: 32,
  },
  sortHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sortSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.textPrimary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border + '80',
  },
  sortOptionActive: { backgroundColor: C.primaryLight + '60' },
  sortOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortOptionIconActive: { backgroundColor: C.primaryLight },
  sortOptionText: { flex: 1, fontSize: 14, fontWeight: '600', color: C.textPrimary },
  sortOptionTextActive: { color: C.primary, fontWeight: '700' },

  // ── Address Dropdown ──
  // ── Dish Modal ──
  dishModalContainer: { flex: 1, justifyContent: 'flex-end' },
  dishModalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: C.overlayDense },
  dishModalSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  dishModalImgBox: { width: '100%', height: 230, position: 'relative' },
  dishModalImg: { width: '100%', height: '100%' },
  dishModalImgPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  dishModalContent: { padding: 16 },
  vegIndicator: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.white,
    marginBottom: 8,
  },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  dishModalTitle: { fontSize: 18, fontWeight: '800', color: C.textPrimary },
  dishModalPrice: { fontSize: 16, fontWeight: '800', color: C.textPrimary, marginTop: 2 },
  dishModalDesc: { fontSize: 13, color: C.textSecondary, lineHeight: 20 },
  dishModalAddBtnFull: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
    elevation: 3,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  dishModalAddTextFull: { color: C.white, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
  dishModalCloseBtnCenter: {
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.overlayDense,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Conflict Modal ──
  conflictOverlay: { flex: 1, backgroundColor: C.overlayDense, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  conflictSheet: {
    backgroundColor: C.white,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    width: '100%',
    elevation: 20,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  conflictClose: { position: 'absolute', top: 12, right: 12, padding: 4 },
  conflictTitle: { fontSize: 18, fontWeight: '800', color: C.textPrimary, marginBottom: 8, marginTop: 4, paddingRight: 24 },
  conflictMessage: { fontSize: 13, color: C.textSecondary, lineHeight: 20, marginBottom: 24 },
  conflictRestName: { fontWeight: '700', color: C.textPrimary },
  conflictBtns: { flexDirection: 'row', gap: 10 },
  conflictBtnNo: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  conflictBtnNoText: { fontSize: 14, fontWeight: '700', color: C.primary },
  conflictBtnReplace: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    elevation: 3,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  conflictBtnReplaceText: { fontSize: 14, fontWeight: '700', color: C.white },
});