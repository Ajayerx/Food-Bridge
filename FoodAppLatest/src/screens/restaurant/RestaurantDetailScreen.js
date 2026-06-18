import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../hooks/useTheme';
import { useUserStore } from '../../store/userStore';
import { RatingStars } from '../../components/common/RatingStars';
import { DishCard } from '../../components/cards/DishCard';
import { CartBar } from '../../components/layout/CartBar';
import { Loader } from '../../components/common/Loader';
import { Divider } from '../../components/common/Divider';
import { VegNonVegIcon } from '../../components/common/VegNonVegIcon';
import { useRestaurantDetail, useRestaurantMenu } from '../../hooks/useRestaurants';
import { useCart } from '../../hooks/useCart';
import { FlashList } from '@shopify/flash-list';

const safe = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return '';
  return String(v);
};

const { width } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
const HERO_HEIGHT = 240;
const NAVBAR_HEIGHT = 56;
const TAB_BAR_HEIGHT = 48;
const COLLAPSE_AT = HERO_HEIGHT - NAVBAR_HEIGHT - STATUS_BAR_HEIGHT;



export const RestaurantDetailScreen = ({ route, navigation }) => {
  const restaurantId = route?.params?.restaurantId;

  if (!restaurantId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Restaurant not found</Text>
      </View>
    );
  }

  const { data: restaurant, isLoading: loadingR } = useRestaurantDetail(restaurantId);
  const { data: menu, isLoading: loadingM } = useRestaurantMenu(restaurantId);

  const {
    items,
    addItem,
    replaceCartAndAdd,
    removeItem,
    itemCount,
    subtotal,
    restaurantName,
  } = useCart();

  const [conflictModal, setConflictModal] = useState(false);
  const [pendingDish, setPendingDish] = useState(null);
  const [activeCategory, setActiveCategory] = useState(0);

  const scrollY = useRef(new Animated.Value(0)).current;
  const sectionListRef = useRef(null);
  const tabScrollRef = useRef(null);
  const activeCategoryRef = useRef(0);
  const isScrollingProgrammatically = useRef(false);
  const categoriesRef = useRef([]);
  const scrollResetTimer = useRef(null);

  const categories = React.useMemo(() => (Array.isArray(menu) ? menu : []), [menu]);
  categoriesRef.current = categories;

  const listData = React.useMemo(() => {
    if (!Array.isArray(menu) || menu.length === 0) return [];
    const result = [];
    menu.forEach(category => {
      result.push({ type: 'header', title: category.name, id: category.id });
      category.items?.forEach(item => {
        result.push({ type: 'item', ...item, category: category.name });
      });
    });
    return result;
  }, [menu]);

  const getQuantity = useCallback(
    (dishId) => {
      const item = items.find(i => i.id === dishId);
      return item ? item.quantity : 0;
    },
    [items]
  );

  const handleRemove = useCallback((id) => removeItem(id), [removeItem]);

  const handleAddItem = useCallback((dish) => {
    const result = addItem(dish, restaurant?.id, restaurant?.name);
    if (result === 'CONFLICT') {
      setPendingDish(dish);
      setConflictModal(true);
    }
  }, [addItem, restaurant]);

  const handleConfirmReplace = useCallback(() => {
    if (pendingDish) {
      replaceCartAndAdd(pendingDish, restaurant?.id, restaurant?.name);
    }
    setConflictModal(false);
    setPendingDish(null);
  }, [pendingDish, replaceCartAndAdd, restaurant]);

  const handleCancelReplace = useCallback(() => {
    setConflictModal(false);
    setPendingDish(null);
  }, []);

  // ── Animated values ──────────────────────────────────────
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSE_AT * 0.6, COLLAPSE_AT],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const heroTranslate = scrollY.interpolate({
    inputRange: [0, COLLAPSE_AT],
    outputRange: [0, -COLLAPSE_AT / 2.5],
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [0, COLLAPSE_AT],
    outputRange: [1, 1.08],
    extrapolate: 'clamp',
  });

  const navBgOpacity = scrollY.interpolate({
    inputRange: [COLLAPSE_AT - 40, COLLAPSE_AT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const navShadowOpacity = scrollY.interpolate({
    inputRange: [COLLAPSE_AT - 20, COLLAPSE_AT + 10],
    outputRange: [0, 0.08],
    extrapolate: 'clamp',
  });

  const navTitleOpacity = scrollY.interpolate({
    inputRange: [COLLAPSE_AT - 10, COLLAPSE_AT + 20],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const navTitleTranslate = scrollY.interpolate({
    inputRange: [COLLAPSE_AT - 10, COLLAPSE_AT + 20],
    outputRange: [10, 0],
    extrapolate: 'clamp',
  });

  const btnBgColor = scrollY.interpolate({
    inputRange: [0, COLLAPSE_AT],
    outputRange: ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.0)'],
    extrapolate: 'clamp',
  });

  const btnIconColor = scrollY.interpolate({
    inputRange: [COLLAPSE_AT - 30, COLLAPSE_AT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // ── FIX: Animated tabs position — starts below hero, sticks below navbar on scroll
  const tabsStickyTop = scrollY.interpolate({
    inputRange: [0, COLLAPSE_AT],
    outputRange: [HERO_HEIGHT + STATUS_BAR_HEIGHT, NAVBAR_HEIGHT + STATUS_BAR_HEIGHT],
    extrapolate: 'clamp',
  });

  const tabsElevation = scrollY.interpolate({
    inputRange: [COLLAPSE_AT - 10, COLLAPSE_AT],
    outputRange: [0, 6],
    extrapolate: 'clamp',
  });

  const estimatedItemSize = 120;

  // ── Scroll to section using scrollToIndex ──────────────
  const scrollToSection = useCallback((index) => {
    const category = categoriesRef.current[index];
    if (!category) return;

    setActiveCategory(index);
    activeCategoryRef.current = index;
    isScrollingProgrammatically.current = true;

    const headerIndex = listData.findIndex(
      (item) =>
        item.type === 'header' &&
        (item.id === category.id || item.title === category.name)
    );

    if (headerIndex === -1) return;

    sectionListRef.current?.scrollToIndex({
      index: headerIndex,
      animated: true,
    });

    tabScrollRef.current?.scrollTo({
      x: Math.max(0, index * 120 - 40),
      animated: true,
    });

    if (scrollResetTimer.current) clearTimeout(scrollResetTimer.current);
    scrollResetTimer.current = setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 700);
  }, [listData]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (isScrollingProgrammatically.current) return;
    if (!viewableItems?.length) return;

    const headerItem = viewableItems.find(v => v.item?.type === 'header');
    if (!headerItem) return;

    const headerData = headerItem.item;
    const cats = categoriesRef.current;

    const index = cats.findIndex(c =>
      (c.id && c.id === headerData.id) || c.name === headerData.title
    );

    if (index !== -1 && index !== activeCategoryRef.current) {
      activeCategoryRef.current = index;
      setActiveCategory(index);
    }
  }).current;

  const viewabilityConfig = { itemVisiblePercentThreshold: 40 };

  useEffect(() => {
    return () => {
      if (scrollResetTimer.current) clearTimeout(scrollResetTimer.current);
    };
  }, []);

  if (loadingR) return <Loader fullScreen />;
  if (loadingM) return <Loader />;
  if (!restaurant) return null;

  const Colors = useTheme();
  const darkMode = useUserStore(s => s.darkMode);
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  const ListDivider = () => <Divider />;

  const CategoryTab = ({ label, active, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 0.92,
        useNativeDriver: true,
        speed: 60,
        bounciness: 0,
      }).start();
    }, []);

    const handlePressOut = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 10,
      }).start();
    }, []);

    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.tab,
            active && styles.tabActive,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={[styles.tabText, active && styles.tabTextActive]}>
            {String(label ?? '')}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.infoContainer}>
      <View style={styles.nameRow}>
        <Text style={styles.restaurantName}>{safe(restaurant?.name)}</Text>
        {restaurant?.is_veg && (
          <View style={styles.vegBadge}>
            <VegNonVegIcon isVeg={true} size={12} />
            <Text style={styles.vegBadgeText}>Pure Veg</Text>
          </View>
        )}
      </View>

      <Text style={styles.cuisinesText}>
        {Array.isArray(restaurant?.cuisines) ? restaurant.cuisines.join(' • ') : ''}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.ratingBadge}>
          <Icon name="star" size={13} color={Colors.white} />
          <Text style={styles.ratingText}>
            {restaurant?.avg_rating ? Number(restaurant.avg_rating).toFixed(1) : 'New'}
          </Text>
          {restaurant?.total_ratings > 0 && (
            <Text style={styles.ratingCount}>({restaurant.total_ratings}+) </Text>
          )}
        </View>
        <View style={styles.statDot} />
        <View style={styles.statItem}>
          <Icon name="schedule" size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}>
            {`${safe(restaurant?.avg_delivery_minutes ?? 30)} min`}
          </Text>
        </View>
        <View style={styles.statDot} />
        <View style={styles.statItem}>
          <Icon name="delivery-dining" size={14} color={Colors.textSecondary} />
          <Text style={styles.statText}>
            {restaurant?.delivery_fee === 0
              ? 'Free Delivery'
              : `₹${safe(restaurant?.delivery_fee)} Delivery`}
          </Text>
        </View>
      </View>

      <View style={styles.addressRow}>
        <Icon name="place" size={13} color={Colors.textLight} />
        <Text style={styles.addressText}>
          {safe(restaurant?.address_line || restaurant?.address || 'Restaurant location')}
        </Text>
      </View>

      {!!restaurant?.min_order_amount && (
        <View style={styles.minOrderRow}>
          <Icon name="info-outline" size={13} color={Colors.textLight} />
          <Text style={styles.minOrderText}>
            {`Minimum order ₹${safe(restaurant.min_order_amount)}`}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle={darkMode ? 'light-content' : 'dark-content'} />

      <Animated.View style={[styles.hero, { opacity: heroOpacity, transform: [{ translateY: heroTranslate }, { scale: heroScale }] }]}>
        <Image
          source={
            restaurant?.cover_image_url || restaurant?.coverImageUrl || restaurant?.image
              ? { uri: restaurant?.cover_image_url || restaurant?.coverImageUrl || restaurant?.image }
              : { uri: 'https://placehold.co/600x400/e2e8f0/94a3b8?text=Restaurant' }
          }
          style={styles.heroImg}
          resizeMode="cover"
        />
        <View style={styles.heroGradientOverlay} />
      </Animated.View>

      <FlashList
        ref={sectionListRef}
        data={listData}
        extraData={items}
        estimatedItemSize={estimatedItemSize}
        drawDistance={500}
        getItemType={(item) => item.type}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={(info) => {
          const offset = info.averageItemLength * info.index;
          sectionListRef.current?.scrollToOffset({
            offset: Math.max(0, offset),
            animated: true,
          });
          setTimeout(() => {
            sectionListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          }, 100);
        }}
        keyExtractor={(item, index) =>
          item.type === 'header'
            ? `header-${item.id || item.title}-${index}`
            : item.id?.toString() || index.toString()
        }
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{
          paddingTop: HERO_HEIGHT + STATUS_BAR_HEIGHT + TAB_BAR_HEIGHT,
          paddingBottom: 140,
          backgroundColor: Colors.surface,
        }}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={{ paddingHorizontal: 16 }}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{safe(item?.title)}</Text>
                </View>
              </View>
            );
          }
          return (
            <View style={{ paddingHorizontal: 16 }}>
              <DishCard
                dish={item}
                quantity={getQuantity(item?.id || item?._id)}
                onAdd={() => handleAddItem(item)}
                onRemove={() => handleRemove(item.id || item._id)}
                isRestaurantOpen={restaurant?.is_open ?? true}
              />
            </View>
          );
        }}
        ItemSeparatorComponent={ListDivider}
        onScroll={(e) => {
          scrollY.setValue(e.nativeEvent.contentOffset.y);
        }}
        onMomentumScrollEnd={() => {
          isScrollingProgrammatically.current = false;
        }}
        scrollEventThrottle={16}
      />

      <View style={[styles.navbar, { paddingTop: STATUS_BAR_HEIGHT }]}>
        <Animated.View style={[StyleSheet.absoluteFill, {
          backgroundColor: Colors.surface,
          opacity: navBgOpacity,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: Colors.border,
        }]} />
        <Animated.View style={[styles.navShadow, { opacity: navShadowOpacity }]} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Animated.View style={[styles.navBtnInner, { backgroundColor: btnBgColor }]}>
            <Icon name="arrow-back-ios" size={18} color={Colors.white} />
          </Animated.View>
          <Animated.View style={[styles.navBtnInnerDark, { opacity: btnIconColor }]}>
            <Icon name="arrow-back-ios" size={18} color={Colors.textPrimary} />
          </Animated.View>
        </TouchableOpacity>
        <Animated.Text
          style={[
            styles.navTitle,
            { opacity: navTitleOpacity, transform: [{ translateY: navTitleTranslate }] },
          ]}
          numberOfLines={1}
        >
          {restaurant.name}
        </Animated.Text>
        <TouchableOpacity style={styles.navBtn}>
          <Animated.View style={[styles.navBtnInner, { backgroundColor: btnBgColor }]}>
            <Icon name="search" size={20} color={Colors.white} />
          </Animated.View>
          <Animated.View style={[styles.navBtnInnerDark, { opacity: btnIconColor }]}>
            <Icon name="search" size={20} color={Colors.textPrimary} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* ── Category Tabs — animated top so they stick properly ── */}
      {categories.length > 0 && (
        <Animated.View style={[styles.tabsBar, { top: tabsStickyTop }]}>
          <Animated.View pointerEvents="none" style={[styles.tabsBarShadow, { elevation: tabsElevation }]} />
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {categories.map((c, i) => (
              <CategoryTab
                key={c.id ?? c.name ?? String(i)}
                label={c.name}
                active={activeCategory === i}
                onPress={() => scrollToSection(i)}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}

      <CartBar
        itemCount={itemCount}
        total={subtotal}
        restaurantName={restaurantName}
        onPress={() => navigation.navigate('CartScreen')}
      />

      <Modal
        visible={conflictModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelReplace}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleCancelReplace}>
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1} onPress={() => { }}>
            <TouchableOpacity style={styles.modalClose} onPress={handleCancelReplace}>
              <Icon name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Replace cart item?</Text>
            <Text style={styles.modalMessage}>
              Your cart contains dishes from{' '}
              <Text style={styles.modalRestName}>{restaurantName}</Text>
              {'. Do you want to discard the selection and add dishes from '}
              <Text style={styles.modalRestName}>{restaurant?.name}</Text>?
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnNo} onPress={handleCancelReplace} activeOpacity={0.8}>
                <Text style={styles.modalBtnNoText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnReplace} onPress={handleConfirmReplace} activeOpacity={0.85}>
                <Text style={styles.modalBtnReplaceText}>Replace</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const createStyles = (C) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },

  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT + STATUS_BAR_HEIGHT,
    zIndex: 1,
    overflow: 'hidden',
  },
  heroImg: { width: '100%', height: '100%' },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },

  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    height: NAVBAR_HEIGHT + STATUS_BAR_HEIGHT,
  },
  navShadow: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'transparent',
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  navBtn: { padding: 4, position: 'relative' },
  navBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnInnerDark: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: C.textPrimary,
    textAlign: 'center',
    marginHorizontal: 4,
  },

  tabsBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 15,
    backgroundColor: C.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
    height: TAB_BAR_HEIGHT,
    justifyContent: 'center',
  },
  tabsBarShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT,
    backgroundColor: C.surface,
  },
  tabsContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
    height: TAB_BAR_HEIGHT,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  tabActive: {
    borderColor: C.primary,
    backgroundColor: C.primaryLight,
    elevation: 2,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textSecondary,
  },
  tabTextActive: {
    color: C.primary,
    fontWeight: '700',
  },

  infoContainer: {
    backgroundColor: C.surface,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: '800',
    color: C.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  vegBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vegBadgeText: { fontSize: 11, fontWeight: '700', color: C.vegGreen },
  cuisinesText: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
    backgroundColor: C.inputBg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.vegGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: { color: C.white, fontWeight: '800', fontSize: 13 },
  ratingCount: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  statDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.border },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: C.textSecondary, fontWeight: '500' },
  statText: { fontSize: 13, color: C.textSecondary, fontWeight: '500' },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
    paddingTop: 2,
  },
  addressText: { fontSize: 12, color: C.textLight, flex: 1 },
  minOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  minOrderText: { fontSize: 12, color: C.textLight },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 14,
    backgroundColor: C.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.textPrimary,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: C.overlayDense,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalSheet: {
    backgroundColor: C.surface,
    borderRadius: 20,
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
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.textPrimary,
    marginBottom: 8,
    marginTop: 4,
    paddingRight: 24,
  },
  modalMessage: {
    fontSize: 13,
    color: C.textSecondary,
    textAlign: 'left',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalRestName: { fontWeight: '700', color: C.textPrimary },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalBtnNo: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  modalBtnNoText: { fontSize: 14, fontWeight: '700', color: C.primary },
  modalBtnReplace: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    elevation: 2,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalBtnReplaceText: { fontSize: 14, fontWeight: '700', color: C.white },
});