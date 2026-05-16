import React, { useState, useRef, useCallback } from 'react';
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
import { Colors } from '../../constants/colors';
import { RatingStars } from '../../components/common/RatingStars';
import { DishCard } from '../../components/cards/DishCard';
import { CartBar } from '../../components/layout/CartBar';
import { Loader } from '../../components/common/Loader';
import { Divider } from '../../components/common/Divider';
import { VegNonVegIcon } from '../../components/common/VegNonVegIcon';
import { useRestaurantDetail, useRestaurantMenu } from '../../hooks/useRestaurants';
import { useCart } from '../../hooks/useCart';
import { FlashList } from "@shopify/flash-list";

const safe = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return "";
  return String(v);
};

const { width } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
const HERO_HEIGHT = 220;
const NAVBAR_HEIGHT = 56;
const TAB_BAR_HEIGHT = 48;
const COLLAPSE_AT = HERO_HEIGHT - NAVBAR_HEIGHT - STATUS_BAR_HEIGHT;

// ─── Category Tab ─────────────────────────────────────────
const CategoryTab = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.tab, active && styles.tabActive]}
    onPress={onPress}
    activeOpacity={0.7}>
    <Text style={[styles.tabText, active && styles.tabTextActive]}>
      {String(label ?? '')}
    </Text>
  </TouchableOpacity>
);
// ─── Main ─────────────────────────────────────────────────
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

  // ── Cart conflict modal state ──────────────────────────
  const [conflictModal, setConflictModal] = useState(false);
  const [pendingDish, setPendingDish] = useState(null);

  const handleRemove = useCallback((id) => removeItem(id), [removeItem]);

  const getQuantity = useCallback(
    (dishId) => {
      const item = items.find(i => i.id === dishId);
      return item ? item.quantity : 0;
    },
    [items]
  );

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

  const [activeCategory, setActiveCategory] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const sectionListRef = useRef(null);
  const tabScrollRef = useRef(null);

  const listData = React.useMemo(() => {
    if (!Array.isArray(menu) || menu.length === 0) return [];
    const result = [];
    menu.forEach(category => {
      result.push({ type: "header", title: category.name, id: category.id }); // ← add id
      category.items?.forEach(item => {
        result.push({ type: "item", ...item, category: category.name });
      });
    });
    return result;
  }, [menu]);

  const categories = React.useMemo(() => (Array.isArray(menu) ? menu : []), [menu]);
  // ── Animated values ──────────────────────────────────────
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSE_AT], outputRange: [1, 0], extrapolate: 'clamp',
  });
  const heroTranslate = scrollY.interpolate({
    inputRange: [0, COLLAPSE_AT], outputRange: [0, -COLLAPSE_AT / 3], extrapolate: 'clamp',
  });
  const navBgOpacity = scrollY.interpolate({
    inputRange: [COLLAPSE_AT - 30, COLLAPSE_AT], outputRange: [0, 1], extrapolate: 'clamp',
  });
  const btnBgColor = scrollY.interpolate({
    inputRange: [0, COLLAPSE_AT], outputRange: ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)'], extrapolate: 'clamp',
  });

  const scrollToSection = (index) => {
    setActiveCategory(index);
    const categoryName = categories[index]?.name;
    if (!categoryName) return;
    const itemIndex = listData.findIndex(item => item.type === "header" && item.title === categoryName);
    if (itemIndex !== -1) {
      sectionListRef.current?.scrollToIndex({ index: itemIndex, animated: true });
    }
    tabScrollRef.current?.scrollTo({ x: index * 120, animated: true });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (!viewableItems?.length) return;
    const headerItem = viewableItems.find(v => v.item?.type === "header");
    if (!headerItem) return;
    const index = categories.findIndex(c => c.name === headerItem.item.title);
    if (index !== -1 && index !== activeCategory) {
      setActiveCategory(index);
    }
  }).current;

  const viewabilityConfig = { itemVisiblePercentThreshold: 40 };

  if (loadingR) return <Loader fullScreen />;
  if (loadingM) return <Loader />;
  if (!restaurant) return null;

  // ── List Header ──────────────────────────────────────────
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
          <Icon name="star" size={13} color="#fff" />
          <Text style={styles.ratingText}>
            {restaurant?.avg_rating ? Number(restaurant.avg_rating).toFixed(1) : 'New'}
          </Text>
          {restaurant?.total_ratings > 0 && (
            <Text style={styles.ratingCount}>({restaurant.total_ratings}+)</Text>
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
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* ── Hero Image ── */}
      <Animated.View style={[styles.hero, { opacity: heroOpacity, transform: [{ translateY: heroTranslate }] }]}>
        <Image
          source={
            restaurant?.cover_image_url || restaurant?.coverImageUrl || restaurant?.image
              ? { uri: restaurant?.cover_image_url || restaurant?.coverImageUrl || restaurant?.image }
              : { uri: 'https://placehold.co/600x400/e2e8f0/94a3b8?text=Restaurant' }
          }
          style={styles.heroImg}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay} />
      </Animated.View>

      {/* ── FlashList ── */}
      <FlashList
        ref={sectionListRef}
        data={listData}
        extraData={items}
        estimatedItemSize={120}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(item, index) =>
          item.type === "header" ? `header-${item.id || item.title}-${index}` : item.id?.toString() || index.toString()
        }
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{
          paddingTop: HERO_HEIGHT + STATUS_BAR_HEIGHT + TAB_BAR_HEIGHT,
          paddingBottom: 140,
          backgroundColor: Colors.white,
        }}
        renderItem={({ item }) => {
          if (item.type === "header") {
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
        ItemSeparatorComponent={() => <Divider />}
        onScroll={(e) => { scrollY.setValue(e.nativeEvent.contentOffset.y); }}
        scrollEventThrottle={16}
      />

      {/* ── Navbar (ABOVE list) ── */}
      <View style={[styles.navbar, { paddingTop: STATUS_BAR_HEIGHT }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.white, opacity: navBgOpacity, borderBottomWidth: 1, borderBottomColor: Colors.border }]} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Animated.View style={[styles.navBtnInner, { backgroundColor: btnBgColor }]}>
            <Icon name="arrow-back-ios" size={18} color={Colors.white} />
          </Animated.View>
        </TouchableOpacity>
        <Animated.Text style={[styles.navTitle, { opacity: navBgOpacity }]} numberOfLines={1}>
          {restaurant.name}
        </Animated.Text>
        <TouchableOpacity style={styles.navBtn}>
          <Animated.View style={[styles.navBtnInner, { backgroundColor: btnBgColor }]}>
            <Icon name="search" size={20} color={Colors.white} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* ── Category Tabs ── */}
      {categories.length > 0 && (
        <Animated.View style={[styles.tabsBar, {
          top: scrollY.interpolate({
            inputRange: [0, COLLAPSE_AT],
            outputRange: [HERO_HEIGHT + STATUS_BAR_HEIGHT, NAVBAR_HEIGHT + STATUS_BAR_HEIGHT],
            extrapolate: 'clamp',
          }),
        }]}>
          {/* FIX: was using the FlashList's contentContainerStyle here by mistake */}
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}  // ← FIXED
          >
            {categories.map((c, i) => (
              <CategoryTab
                key={c.id}
                label={c.name}
                active={activeCategory === i}
                onPress={() => scrollToSection(i)}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* ── Cart Bar ── */}
      <CartBar
        itemCount={itemCount}
        total={subtotal}
        restaurantName={restaurantName}
        onPress={() => navigation.navigate('CartScreen')}
      />

      {/* ── Cart Conflict Modal ── */}
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
              <Text style={styles.modalRestName}>{restaurant?.name}</Text>{'?'}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },

  // ── Hero ──
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: HERO_HEIGHT + STATUS_BAR_HEIGHT, zIndex: 1 },
  heroImg: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },

  // ── Navbar ──
  navbar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10, height: NAVBAR_HEIGHT + STATUS_BAR_HEIGHT },
  navBtn: { padding: 4 },
  navBtnInner: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  navTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginHorizontal: 4 },

  // ── Tabs ──
  tabsBar: {
    position: 'absolute',
    left: 0, right: 0,
    zIndex: 15,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    height: TAB_BAR_HEIGHT,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    justifyContent: 'center',
  },
  // FIX: correct style for the tab ScrollView's contentContainerStyle
  // Previously a copy of FlashList's contentContainerStyle was used here —
  // that caused the tabs to render with massive top padding and be invisible.
  tabsContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
    height: TAB_BAR_HEIGHT,
  },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  tabActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },

  // ── Info Card ──
  infoContainer: { backgroundColor: Colors.white, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  restaurantName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, flex: 1, marginRight: 8 },
  vegBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  vegBadgeText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
  cuisinesText: { fontSize: 13, color: Colors.textSecondary, marginBottom: 10 },
  statsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2E7D32', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 3 },
  ratingText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  ratingCount: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  statDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: Colors.textSecondary },
  statText: { fontSize: 13, color: Colors.textSecondary },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 12 },
  addressText: { fontSize: 12, color: Colors.textLight },
  offerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight, padding: 12, borderRadius: 12, marginBottom: 8, gap: 10, borderWidth: 1, borderColor: Colors.primary + '30' },
  offerTexts: { flex: 1 },
  offerTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  offerSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  minOrderRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6 },
  minOrderText: { fontSize: 12, color: Colors.textLight },

  // ── Section Headers ──
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.background },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  sectionCountBadge: { backgroundColor: Colors.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  sectionCount: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  // ── Cart Conflict Modal ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalSheet: { backgroundColor: Colors.white, borderRadius: 20, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, width: '100%', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  modalClose: { position: 'absolute', top: 12, right: 12, padding: 4 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8, marginTop: 4, paddingRight: 24 },
  modalMessage: { fontSize: 13, color: Colors.textSecondary, textAlign: 'left', lineHeight: 20, marginBottom: 24 },
  modalRestName: { fontWeight: '700', color: Colors.textPrimary },
  modalBtns: { flexDirection: 'row', gap: 10, width: '100%' },
  modalBtnNo: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#FFF3E0', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFCC80' },
  modalBtnNoText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  modalBtnReplace: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  modalBtnReplaceText: { fontSize: 14, fontWeight: '700', color: Colors.white },
});