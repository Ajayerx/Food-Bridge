import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Platform,
  Modal,
  Pressable,
  Image,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from '../../constants/colors';
import { EmptyState } from '../../components/common/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';
import { CATEGORIES } from '../../constants/categories';
import api from '../../services/api/base';
import { useCart } from '../../hooks/useCart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────
const STORAGE_KEY = 'foodbridge_recent_searches';
const MAX_RECENT = 8;
const MIN_QUERY = 2;
const PRIMARY = Colors.primary || '#FF5200';
const GREEN = '#1BA672';
const BG = '#F4F4F4';
const WHITE = '#FFFFFF';
const BORDER = '#E8E8E8';
const TEXT_DARK = '#1C1C1C';
const TEXT_MID = '#686B78';
const TEXT_LIGHT = '#93959F';

// ─── Filter mode: which section's filters are active ─────
const FILTER_MODE = {
  RESTAURANTS: 'restaurants',
  DISHES: 'dishes',
};

// ─── Sort options ─────────────────────────────────────────
const RESTAURANT_SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'rating', label: 'Rating' },
  { id: 'delivery_fee', label: 'Delivery charges' },
  { id: 'delivery_time', label: 'Delivery time' },
];

const DISH_SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
];

// ─── Helpers ──────────────────────────────────────────────
function parseCuisines(cuisines) {
  if (!cuisines) return [];
  if (Array.isArray(cuisines)) return cuisines;
  try { return JSON.parse(cuisines); } catch { return []; }
}

// ─── Shimmer ──────────────────────────────────────────────
function useShimmer() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return anim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.85] });
}

const SHIMMER_COLOR = '#E5E7EB';

const SkeletonDishCard = () => {
  const opacity = useShimmer();
  return (
    <Animated.View style={[s.dishCard, { opacity }]}>
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ height: 8, width: 18, borderRadius: 2, backgroundColor: SHIMMER_COLOR }} />
        <View style={{ height: 14, width: '70%', borderRadius: 4, backgroundColor: SHIMMER_COLOR }} />
        <View style={{ height: 11, width: '40%', borderRadius: 4, backgroundColor: SHIMMER_COLOR }} />
        <View style={{ height: 13, width: '30%', borderRadius: 4, backgroundColor: SHIMMER_COLOR }} />
      </View>
      <View style={[s.dishImgBox, { backgroundColor: SHIMMER_COLOR }]} />
    </Animated.View>
  );
};

const SkeletonRestCard = () => {
  const opacity = useShimmer();
  return (
    <Animated.View style={[s.newRestCard, { opacity }]}>
      <View style={[s.newRestImageWrap, { backgroundColor: SHIMMER_COLOR }]} />
      <View style={{ flex: 1, gap: 9 }}>
        <View style={{ height: 14, width: '60%', borderRadius: 4, backgroundColor: SHIMMER_COLOR }} />
        <View style={{ height: 11, width: '40%', borderRadius: 4, backgroundColor: SHIMMER_COLOR }} />
        <View style={{ height: 11, width: '70%', borderRadius: 4, backgroundColor: SHIMMER_COLOR }} />
      </View>
    </Animated.View>
  );
};

// ─── Veg indicator ────────────────────────────────────────
const VegDot = ({ dietaryTag }) => {
  const tag = dietaryTag?.toLowerCase();
  const isVeg = tag === 'veg' || tag === 'vegan';
  const color = isVeg ? GREEN : '#E43B3B';
  return (
    <View style={[s.vegBox, { borderColor: color }]}>
      <View style={[s.vegDot, { backgroundColor: color }]} />
    </View>
  );
};

// ─── SearchBar ────────────────────────────────────────────
const SearchBar = memo(({ value, onChangeText, onClear, onSubmitEditing, inputRef }) => (
  <View style={s.searchBar}>
    <Icon name="search" size={18} color={TEXT_LIGHT} />
    <TextInput
      ref={inputRef}
      style={s.searchInput}
      value={value}
      onChangeText={onChangeText}
      placeholder="Search for restaurants and food"
      placeholderTextColor={TEXT_LIGHT}
      autoFocus
      returnKeyType="search"
      onSubmitEditing={onSubmitEditing}
    />
    {value.length > 0 && (
      <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="cancel" size={18} color={TEXT_LIGHT} />
      </TouchableOpacity>
    )}
  </View>
));

// ─── Filter chip ──────────────────────────────────────────
const FilterChip = memo(({ label, icon, active, onPress }) => (
  <TouchableOpacity
    style={[s.filterChip, active && s.filterChipActive]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Text style={[s.filterChipText, active && s.filterChipTextActive]}>
      {label}
    </Text>
    {icon
      ? <Icon name={icon} size={15} color={active ? WHITE : '#6B7280'} />
      : active && <Icon name="close" size={12} color={WHITE} style={{ marginLeft: 2 }} />
    }
  </TouchableOpacity>
));

// ─── Sort + Filter bottom sheet ───────────────────────────
// For restaurants: sort options only.
// For dishes: sort options + price range picker.
const PRICE_RANGE_OPTIONS = [
  { label: 'Any price', value: null },
  { label: 'Under ₹100', value: 100 },
  { label: 'Under ₹200', value: 200 },
  { label: 'Under ₹300', value: 300 },
  { label: 'Under ₹500', value: 500 },
  { label: 'Under ₹800', value: 800 },
];

const SortSheet = ({ visible, currentSort, options, isDishSection, currentMaxPrice, onSelect, onPriceSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={s.sheetOverlay} onPress={onClose}>
      <Pressable style={s.sheetContainer}>
        <View style={s.sheetHandle} />
        <Text style={s.sheetTitle}>Sort By</Text>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={s.sheetOption}
            onPress={() => { onSelect(opt.id); onClose(); }}
            activeOpacity={0.7}
          >
            <Text style={[s.sheetOptionText, currentSort === opt.id && s.sheetOptionActive]}>
              {opt.label}
            </Text>
            {currentSort === opt.id && <Icon name="check" size={18} color={PRIMARY} />}
          </TouchableOpacity>
        ))}

        {/* Price range — only shown for dishes section */}
        {isDishSection && (
          <>
            <Text style={[s.sheetTitle, { marginTop: 20 }]}>Max Price</Text>
            {PRICE_RANGE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={String(opt.value)}
                style={s.sheetOption}
                onPress={() => { onPriceSelect(opt.value); onClose(); }}
                activeOpacity={0.7}
              >
                <Text style={[s.sheetOptionText, currentMaxPrice === opt.value && s.sheetOptionActive]}>
                  {opt.label}
                </Text>
                {currentMaxPrice === opt.value && <Icon name="check" size={18} color={PRIMARY} />}
              </TouchableOpacity>
            ))}
          </>
        )}
      </Pressable>
    </Pressable>
  </Modal>
);

// ─── Dish Card ────────────────────────────────────────────
const CARD_IMG = 110;
const CARD_IMG_RADIUS = 12;

const DishCard = memo(({ dish, quantity, onAdd, onRemove }) => {
  const hasImg = !!dish.image_url;
  return (
    <View style={s.dishCard}>
      <View style={s.dishInfo}>
        <VegDot dietaryTag={dish.dietary_tag} />
        <Text style={s.dishName} numberOfLines={2}>{dish.name}</Text>
        {dish.restaurant_name ? (
          <View style={s.dishRestRow}>
            <Icon name="near-me" size={11} color={TEXT_LIGHT} />
            <Text style={s.dishRestName} numberOfLines={1}>{dish.restaurant_name}</Text>
          </View>
        ) : null}
        <View style={s.dishPriceRow}>
          <Text style={s.dishPrice}>
            ₹{Number(dish.price || dish.base_price || 0).toFixed(0)}
          </Text>
        </View>
      </View>
      <View style={s.dishImgWrap}>
        {hasImg ? (
          <Image source={{ uri: dish.image_url }} style={s.dishImgBox} resizeMode="cover" />
        ) : (
          <View style={[s.dishImgBox, s.dishImgPlaceholder]}>
            <Text style={s.dishEmoji}>🍽️</Text>
          </View>
        )}
        {quantity > 0 ? (
          <View style={s.stepper}>
            <TouchableOpacity style={s.stepBtn} onPress={onRemove} activeOpacity={0.8}>
              <Text style={s.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={s.stepCount}>{quantity}</Text>
            <TouchableOpacity style={s.stepBtn} onPress={onAdd} activeOpacity={0.8}>
              <Text style={s.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.addBtn} onPress={onAdd} activeOpacity={0.8}>
            <Text style={s.addBtnText}>ADD</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

// ─── Restaurant row card ──────────────────────────────────
const RestaurantRowCard = memo(({ item, onPress }) => {
  const cuisines = parseCuisines(item.cuisines).slice(0, 3).join(', ');
  const deliveryTime = item.avg_delivery_minutes || item.avg_prep_time_minutes || 25;
  const imageUrl = item.cover_image_url || item.banner_url || item.image_url || item.logo_url;
  const isClosed = !item.is_open;

  return (
    <TouchableOpacity style={s.newRestCard} onPress={onPress} activeOpacity={0.9}>
      <View style={s.newRestImageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={s.newRestImage} resizeMode="cover" />
        ) : (
          <View style={[s.newRestImage, { backgroundColor: '#FFE8D6', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 24 }}>🍽️</Text>
          </View>
        )}
        {isClosed && (
          <View style={s.closedOverlay}>
            <Text style={s.closedOverlayText}>CLOSED</Text>
          </View>
        )}
      </View>
      <View style={s.newRestContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[s.newRestName, isClosed && { color: TEXT_LIGHT }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.avg_rating > 0 && (
            <View style={s.ratingBadge}>
              <Text style={s.ratingText}>⭐ {Number(item.avg_rating).toFixed(1)}</Text>
            </View>
          )}
        </View>
        <Text style={s.newRestMeta}>
          {deliveryTime}–{deliveryTime + 5} mins · {item.delivery_fee === 0 ? 'Free delivery' : `₹${Number(item.delivery_fee || 0).toFixed(0)} delivery`}
        </Text>
        {cuisines ? <Text style={s.newRestCuisine} numberOfLines={1}>{cuisines}</Text> : null}
        {item.address_line ? <Text style={s.newRestAddress} numberOfLines={1}>{item.address_line}</Text> : null}
      </View>
    </TouchableOpacity>
  );
});

// ─── Section header (per-section title + filter chips) ────
const SectionHeader = memo(({ title, count, sortLabel, sortActive, onSortPress, filterChips }) => (
  <View style={s.sectionHeaderWrap}>
    {/* Title row */}
    <View style={s.sectionTitleRow}>
      <View style={s.sectionTitleLeft}>
        <Text style={s.sectionHeading}>{title}</Text>
        {count > 0 && (
          <View style={s.sectionBadge}>
            <Text style={s.sectionBadgeText}>{count}</Text>
          </View>
        )}
      </View>
    </View>

    {/* Filter chips row */}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.filterScroll}
    >
      {/* Sort chip — calls onSortPress directly, no filterMode indirection */}
      <FilterChip
        label={sortLabel}
        icon="keyboard-arrow-down"
        active={sortActive}
        onPress={onSortPress}
      />
      {filterChips}
    </ScrollView>
  </View>
));

// ─── Pre-search view ──────────────────────────────────────
const PreSearchView = memo(({ recentSearches, onClear, onSuggestionTap }) => (
  <ScrollView
    style={s.suggestions}
    showsVerticalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
    contentContainerStyle={{ paddingBottom: 40 }}
  >
    <View style={s.recentHeader}>
      <Text style={s.sectionTitle}>Recent Searches</Text>
      {recentSearches.length > 0 && (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.clearText}>Clear all</Text>
        </TouchableOpacity>
      )}
    </View>
    {recentSearches.length === 0
      ? <Text style={s.emptyRecent}>No recent searches</Text>
      : (
        <View style={s.chipsRow}>
          {recentSearches.map(term => (
            <TouchableOpacity key={term} style={s.recentChip} onPress={() => onSuggestionTap(term)} activeOpacity={0.7}>
              <Icon name="history" size={14} color="#6B7280" style={{ marginRight: 6 }} />
              <Text style={s.recentText} numberOfLines={1}>{term}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )
    }
    <Text style={[s.sectionTitle, { marginTop: 8, marginBottom: 14 }]}>Browse Categories</Text>
    <View style={s.catGrid}>
      {CATEGORIES.map(cat => (
        <TouchableOpacity
          key={cat.id}
          style={[s.catCard, { backgroundColor: cat.color + '20' }]}
          onPress={() => onSuggestionTap(cat.name)}
          activeOpacity={0.75}
        >
          <View style={[s.catIconCircle, { backgroundColor: cat.color + '30' }]}>
            <Text style={s.catEmoji}>{cat.emoji}</Text>
          </View>
          <Text style={[s.catName, { color: cat.color }]}>{cat.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </ScrollView>
));

// ─── Cart bar ─────────────────────────────────────────────
const CartBar = memo(({ itemCount, total, restaurantName, onPress }) => {
  if (!itemCount || itemCount === 0) return null;
  return (
    <TouchableOpacity style={s.cartBar} onPress={onPress} activeOpacity={0.9}>
      <View style={s.cartLeft}>
        <View style={s.cartBadge}>
          <Text style={s.cartBadgeText}>{itemCount}</Text>
        </View>
        <View style={s.cartInfo}>
          <Text style={s.cartItemsText}>{itemCount} Item{itemCount !== 1 ? 's' : ''} added</Text>
          <Text style={s.cartRestName} numberOfLines={1}>{restaurantName || 'Your Cart'}</Text>
        </View>
      </View>
      <View style={s.cartRight}>
        <View>
          <Text style={s.cartPrice}>₹{Number(total).toFixed(0)}</Text>
          <Text style={s.cartTaxes}>+ taxes</Text>
        </View>
        <Icon name="chevron-right" size={24} color={WHITE} />
      </View>
    </TouchableOpacity>
  );
});

// ─── Cart conflict modal ───────────────────────────────────
const CartConflictModal = memo(({ visible, cartRestaurantName, pendingRestaurantName, onCancel, onConfirm }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onCancel}>
      <TouchableOpacity style={s.modalSheet} activeOpacity={1} onPress={() => { }}>
        <TouchableOpacity style={s.modalClose} onPress={onCancel}>
          <Icon name="close" size={20} color="#6B7280" />
        </TouchableOpacity>
        <Text style={s.modalTitle}>Replace cart item?</Text>
        <Text style={s.modalMessage}>
          Your cart contains dishes from{' '}
          <Text style={s.modalRestName}>{cartRestaurantName}</Text>
          {'. Do you want to discard the selection and add dishes from '}
          <Text style={s.modalRestName}>{pendingRestaurantName}</Text>{'?'}
        </Text>
        <View style={s.modalBtns}>
          <TouchableOpacity style={s.modalBtnNo} onPress={onCancel} activeOpacity={0.8}>
            <Text style={s.modalBtnNoText}>No</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.modalBtnReplace} onPress={onConfirm} activeOpacity={0.85}>
            <Text style={s.modalBtnReplaceText}>Replace</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
));

// ═══════════════════════════════════════════════════════════
// ─── Main Screen ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
export const SearchScreen = ({ navigation, route }) => {
  const {
    items,
    itemCount,
    subtotal,
    restaurantId: cartRestaurantId,
    restaurantName: cartRestaurantName,
    addItem,
    replaceCartAndAdd,
    removeItem,
    getQuantityForItem,
  } = useCart();

  // ── Local state ────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [restResults, setRestResults] = useState([]);
  const [dishResults, setDishResults] = useState([]);
  const [isLoadingRest, setIsLoadingRest] = useState(false);
  const [isLoadingDish, setIsLoadingDish] = useState(false);
  const [error, setError] = useState('');

  // ── Sort sheet state — tracks WHICH section's sort to show ──
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [activeSortSection, setActiveSortSection] = useState(FILTER_MODE.RESTAURANTS);

  const [conflictModal, setConflictModal] = useState(false);
  const [pendingDish, setPendingDish] = useState(null);
  const [pendingRestaurantId, setPendingRestaurantId] = useState(null);
  const [pendingRestaurantName, setPendingRestaurantName] = useState(null);

  // ── Filter state — INDEPENDENT for each section ────────
  const [restFilters, setRestFilters] = useState({
    sort: 'relevance',
    isPureVeg: false,
    rated4: false,
    isOpen: false,
  });
  const [dishFilters, setDishFilters] = useState({
    sort: 'relevance',
    veg: false,
    maxPrice: null,
  });

  const inputRef = useRef(null);
  const debounced = useDebounce(query, 400);
  const restAbortRef = useRef(null);
  const dishAbortRef = useRef(null);
  const showResults = debounced.trim().length >= MIN_QUERY;

  // ── Auto-fill query from route.params ─────────────────
  useEffect(() => {
    const incomingQuery = route?.params?.query;
    const autoFill = route?.params?.autoFill;
    if (incomingQuery && autoFill) setQuery(incomingQuery);
  }, [route?.params?.query, route?.params?.autoFill]);

  // ── Recent searches ────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => raw && setRecentSearches(JSON.parse(raw)))
      .catch(() => { });
  }, []);

  const saveSearch = useCallback(async (term) => {
    const t = term.trim();
    if (!t || t.length < MIN_QUERY) return;
    setRecentSearches(prev => {
      const next = [t, ...prev.filter(s => s.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => { });
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => { });
  }, []);

  // ── Fetch restaurants ──────────────────────────────────
  // Re-runs whenever debounced query OR restFilters change
  useEffect(() => {
    const trimmed = debounced.trim();
    if (trimmed.length < MIN_QUERY) { setRestResults([]); setError(''); return; }

    if (restAbortRef.current) restAbortRef.current.abort();
    const controller = new AbortController();
    restAbortRef.current = controller;

    setIsLoadingRest(true);
    setError('');

    const params = {
      search: trimmed,
      ...(restFilters.sort !== 'relevance' && { sortBy: restFilters.sort }),
      ...(restFilters.isPureVeg && { isPureVeg: true }),
      ...(restFilters.rated4 && { minRating: 4 }),
      ...(restFilters.isOpen && { isOpen: true }),
      page: 1,
      pageSize: 20,
    };

    api.get('/restaurants', { params, signal: controller.signal })
      .then(res => {
        if (controller.signal.aborted) return;
        setRestResults(res.data?.data ?? []);
      })
      .catch(err => {
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
        setError('Something went wrong. Please try again.');
        setRestResults([]);
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoadingRest(false); });

    return () => controller.abort();
  }, [debounced, restFilters]); // ✅ restFilters as dependency — triggers refetch on any filter change

  // ── Fetch dishes ──────────────────────────────────────
  // Re-runs whenever debounced query OR dishFilters change
  useEffect(() => {
    const trimmed = debounced.trim();
    if (trimmed.length < MIN_QUERY) { setDishResults([]); return; }

    if (dishAbortRef.current) dishAbortRef.current.abort();
    const controller = new AbortController();
    dishAbortRef.current = controller;

    setIsLoadingDish(true);

    const params = {
      q: trimmed,
      ...(dishFilters.veg && { dietaryTag: 'Veg' }),
      ...(dishFilters.maxPrice && { maxPrice: dishFilters.maxPrice }),
      page: 1,
      pageSize: 20,
    };

    api.get('/menu-items/search', { params, signal: controller.signal })
      .then(res => {
        if (controller.signal.aborted) return;
        let data = res.data?.data ?? [];

        // Client-side sort for dishes
        if (dishFilters.sort === 'price_asc') {
          data = [...data].sort((a, b) => (a.base_price || 0) - (b.base_price || 0));
        } else if (dishFilters.sort === 'price_desc') {
          data = [...data].sort((a, b) => (b.base_price || 0) - (a.base_price || 0));
        }

        setDishResults(data);
      })
      .catch(err => {
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoadingDish(false); });

    return () => controller.abort();
  }, [debounced, dishFilters]); // ✅ dishFilters as dependency — triggers re-fetch + client sort on change

  // ── Handlers ──────────────────────────────────────────
  const handleRestaurantPress = useCallback((restaurant) => {
    saveSearch(debounced.trim());
    navigation.navigate('RestaurantDetailScreen', { restaurantId: restaurant.id });
  }, [debounced, saveSearch, navigation]);

  const handleAddDish = useCallback((dish) => {
    const dishRestaurantId = dish.restaurant_id;
    const dishRestaurantName = dish.restaurant_name;
    if (!dishRestaurantId) {
      Alert.alert('Error', 'Unable to add item. Restaurant information missing.');
      return;
    }
    const result = addItem(dish, dishRestaurantId, dishRestaurantName);
    if (result === 'CONFLICT') {
      setPendingDish(dish);
      setPendingRestaurantId(dishRestaurantId);
      setPendingRestaurantName(dishRestaurantName);
      setConflictModal(true);
    }
  }, [addItem]);

  const handleConfirmReplace = useCallback(() => {
    if (pendingDish) replaceCartAndAdd(pendingDish, pendingRestaurantId, pendingRestaurantName);
    setConflictModal(false);
    setPendingDish(null);
    setPendingRestaurantId(null);
    setPendingRestaurantName(null);
  }, [pendingDish, pendingRestaurantId, pendingRestaurantName, replaceCartAndAdd]);

  const handleCancelReplace = useCallback(() => {
    setConflictModal(false);
    setPendingDish(null);
    setPendingRestaurantId(null);
    setPendingRestaurantName(null);
  }, []);

  const handleRemoveDish = useCallback((dishId) => removeItem(dishId), [removeItem]);
  const handleSuggestionTap = useCallback((term) => setQuery(term), []);
  const handleSubmitEditing = useCallback(() => {
    if (query.trim().length >= MIN_QUERY) saveSearch(query.trim());
  }, [query, saveSearch]);
  const handleClear = useCallback(() => {
    setQuery(''); setRestResults([]); setDishResults([]); setError('');
  }, []);

  const toggleRestFilter = useCallback((key) =>
    setRestFilters(p => ({ ...p, [key]: !p[key] })), []);

  const toggleDishFilter = useCallback((key) =>
    setDishFilters(p => ({ ...p, [key]: !p[key] })), []);

  // Sort labels for each section
  const restSortLabel = useMemo(() =>
    RESTAURANT_SORT_OPTIONS.find(o => o.id === restFilters.sort)?.label ?? 'Sort',
    [restFilters.sort]);

  const dishSortLabel = useMemo(() =>
    DISH_SORT_OPTIONS.find(o => o.id === dishFilters.sort)?.label ?? 'Sort',
    [dishFilters.sort]);

  // ── Render helpers ────────────────────────────────────
  const renderDishItem = useCallback(({ item }) => {
    const quantity = getQuantityForItem(item.id);
    return (
      <View style={s.dishRowWrapper}>
        <DishCard
          dish={item}
          quantity={quantity}
          onAdd={() => handleAddDish(item)}
          onRemove={() => handleRemoveDish(item.id)}
        />
      </View>
    );
  }, [handleAddDish, handleRemoveDish, getQuantityForItem]);

  const renderRestItem = useCallback(({ item }) => (
    <RestaurantRowCard item={item} onPress={() => handleRestaurantPress(item)} />
  ), [handleRestaurantPress]);

  // ── Restaurant filter chips (passed into SectionHeader) ──
  const restFilterChips = useMemo(() => (
    <>
      <FilterChip
        label="Open Now"
        active={restFilters.isOpen}
        onPress={() => toggleRestFilter('isOpen')}
      />
      <FilterChip
        label="Pure Veg"
        active={restFilters.isPureVeg}
        onPress={() => toggleRestFilter('isPureVeg')}
      />
      <FilterChip
        label="Rated 4+"
        active={restFilters.rated4}
        onPress={() => toggleRestFilter('rated4')}
      />
    </>
  ), [restFilters, toggleRestFilter]);

  // ── Dish filter chips — only Veg; price moved to filter sheet ──
  const dishFilterChips = useMemo(() => (
    <>
      <FilterChip
        label="Veg Only"
        active={dishFilters.veg}
        onPress={() => toggleDishFilter('veg')}
      />
      {/* Show active price chip as a removable pill so user can see + clear it */}
      {dishFilters.maxPrice != null && (
        <FilterChip
          label={`Under ₹${dishFilters.maxPrice}`}
          active
          onPress={() => setDishFilters(p => ({ ...p, maxPrice: null }))}
        />
      )}
    </>
  ), [dishFilters, toggleDishFilter]);

  // ── Combined results list ──────────────────────────────
  // We render a single ScrollView with:
  //   1. Restaurant section header + list
  //   2. Visual divider
  //   3. Dishes section header + list
  const renderCombinedResults = () => {
    const restLoading = isLoadingRest;
    const dishLoading = isLoadingDish;
    const hasRest = restResults.length > 0;
    const hasDish = dishResults.length > 0;
    // Only show "nothing found" when BOTH fetches have completed AND both returned empty.
    // If either is still loading we wait — avoids flash of empty state during parallel fetches.
    const bothDone = !restLoading && !dishLoading;
    const nothingFound = bothDone && !hasRest && !hasDish;

    if (nothingFound) {
      return (
        <EmptyState
          emoji="🔍"
          title="No results found"
          subtitle={`Nothing matched "${debounced.trim()}". Try a different keyword.`}
          buttonTitle="Clear search"
          onButtonPress={handleClear}
        />
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Restaurants section ── */}
        <SectionHeader
          title="Restaurants"
          count={restResults.length}
          sortLabel={restSortLabel}
          sortActive={restFilters.sort !== 'relevance'}
          onSortPress={() => {
            setActiveSortSection(FILTER_MODE.RESTAURANTS);
            setShowSortSheet(true);
          }}
          filterChips={restFilterChips}
        />

        {restLoading ? (
          <View style={{ paddingTop: 4 }}>
            {[1, 2].map(k => <SkeletonRestCard key={k} />)}
          </View>
        ) : !hasRest ? (
          <View style={s.sectionEmpty}>
            <Text style={s.sectionEmptyText}>No restaurants matched "{debounced.trim()}"</Text>
          </View>
        ) : (
          restResults.map(item => (
            <RestaurantRowCard
              key={`r-${item.id}`}
              item={item}
              onPress={() => handleRestaurantPress(item)}
            />
          ))
        )}

        {/* ── Visual divider between sections ── */}
        <View style={s.sectionDivider}>
          <View style={s.sectionDividerLine} />
          <View style={s.sectionDividerPill}>
            <Icon name="restaurant-menu" size={14} color={TEXT_MID} />
            <Text style={s.sectionDividerText}>Dishes</Text>
          </View>
          <View style={s.sectionDividerLine} />
        </View>

        {/* ── Dishes section ── */}
        <SectionHeader
          title="Dishes"
          count={dishResults.length}
          sortLabel={dishSortLabel}
          sortActive={dishFilters.sort !== 'relevance'}
          onSortPress={() => {
            setActiveSortSection(FILTER_MODE.DISHES);
            setShowSortSheet(true);
          }}
          filterChips={dishFilterChips}
        />

        {dishLoading ? (
          <View style={{ paddingTop: 4 }}>
            {[1, 2].map(k => <SkeletonDishCard key={k} />)}
          </View>
        ) : !hasDish ? (
          <View style={s.sectionEmpty}>
            <Text style={s.sectionEmptyText}>No dishes matched "{debounced.trim()}"</Text>
          </View>
        ) : (
          dishResults.map(item => {
            const quantity = getQuantityForItem(item.id);
            return (
              <View key={`d-${item.id}`} style={s.dishRowWrapper}>
                <DishCard
                  dish={item}
                  quantity={quantity}
                  onAdd={() => handleAddDish(item)}
                  onRemove={() => handleRemoveDish(item.id)}
                />
              </View>
            );
          })
        )}
      </ScrollView>
    );
  };

  const renderContent = () => {
    if (!showResults) {
      return (
        <PreSearchView
          recentSearches={recentSearches}
          onClear={clearRecentSearches}
          onSuggestionTap={handleSuggestionTap}
        />
      );
    }

    if (error) {
      return (
        <EmptyState
          emoji="⚠️"
          title="Something went wrong"
          subtitle={error}
          buttonTitle="Try Again"
          onButtonPress={() => setQuery(q => q)}
        />
      );
    }

    return renderCombinedResults();
  };

  // ── Sort sheet — adapts to which section triggered it ──
  const sortSheetOptions = activeSortSection === FILTER_MODE.RESTAURANTS
    ? RESTAURANT_SORT_OPTIONS
    : DISH_SORT_OPTIONS;

  const sortSheetCurrentValue = activeSortSection === FILTER_MODE.RESTAURANTS
    ? restFilters.sort
    : dishFilters.sort;

  const handleSortSelect = useCallback((val) => {
    if (activeSortSection === FILTER_MODE.RESTAURANTS) {
      setRestFilters(p => ({ ...p, sort: val }));
    } else {
      setDishFilters(p => ({ ...p, sort: val }));
    }
  }, [activeSortSection]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar backgroundColor={WHITE} barStyle="dark-content" />

      {/* Search row */}
      <View style={s.searchRow}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <SearchBar
          inputRef={inputRef}
          value={query}
          onChangeText={setQuery}
          onClear={handleClear}
          onSubmitEditing={handleSubmitEditing}
        />
      </View>

      <View style={{ flex: 1 }}>{renderContent()}</View>

      <CartBar
        itemCount={itemCount}
        total={subtotal}
        restaurantName={cartRestaurantName}
        onPress={() => navigation.navigate('CartScreen')}
      />

      {/* Sort+Filter sheet — shows price range too when triggered from Dishes section */}
      <SortSheet
        visible={showSortSheet}
        currentSort={sortSheetCurrentValue}
        options={sortSheetOptions}
        isDishSection={activeSortSection === FILTER_MODE.DISHES}
        currentMaxPrice={dishFilters.maxPrice}
        onSelect={handleSortSelect}
        onPriceSelect={(val) => setDishFilters(p => ({ ...p, maxPrice: val }))}
        onClose={() => setShowSortSheet(false)}
      />

      <CartConflictModal
        visible={conflictModal}
        cartRestaurantName={cartRestaurantName}
        pendingRestaurantName={pendingRestaurantName}
        onCancel={handleCancelReplace}
        onConfirm={handleConfirmReplace}
      />
    </SafeAreaView>
  );
};

// ═══════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: BORDER,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  backBtn: { padding: 4 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: BG, borderRadius: 10,
    paddingHorizontal: 12, height: 44,
    gap: 8, borderWidth: 1.5, borderColor: BORDER,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: TEXT_DARK, padding: 0 },

  // ── Section headers (inline, per-section) ──
  sectionHeaderWrap: {
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 14,
    marginBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 8,
  },
  sectionTitleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: TEXT_DARK },
  sectionBadge: {
    backgroundColor: PRIMARY + '18', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  sectionBadgeText: { fontSize: 12, fontWeight: '700', color: PRIMARY },

  // ── Visual divider between restaurant/dish sections ──
  sectionDivider: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginVertical: 18, gap: 10,
  },
  sectionDividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  sectionDividerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: WHITE, borderRadius: 999,
    borderWidth: 1, borderColor: BORDER,
  },
  sectionDividerText: { fontSize: 12, fontWeight: '700', color: TEXT_MID },

  // ── Empty state per section ──
  sectionEmpty: {
    paddingHorizontal: 16, paddingVertical: 20, alignItems: 'center',
  },
  sectionEmptyText: { fontSize: 13, color: TEXT_LIGHT, fontStyle: 'italic' },

  // ── Filters ──
  filterScroll: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1.5, borderColor: BORDER, backgroundColor: WHITE,
  },
  filterChipActive: { backgroundColor: '#1C1C1C', borderColor: '#1C1C1C' },
  filterChipText: { fontSize: 13, fontWeight: '700', color: TEXT_DARK },
  filterChipTextActive: { color: WHITE },

  // ── Restaurant card ──
  newRestCard: {
    flexDirection: 'row', backgroundColor: WHITE,
    borderWidth: 1, borderColor: '#F1F1F1',
    marginHorizontal: 12, marginVertical: 6,
    padding: 12, borderRadius: 14, gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  newRestImageWrap: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden' },
  newRestImage: { width: '100%', height: '100%' },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', borderRadius: 12,
  },
  closedOverlayText: { color: WHITE, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  newRestContent: { flex: 1, justifyContent: 'center', gap: 3 },
  newRestName: { fontSize: 15, fontWeight: '700', color: '#111', flex: 1, marginRight: 4 },
  newRestMeta: { fontSize: 12, color: TEXT_MID },
  newRestCuisine: { fontSize: 12, color: TEXT_LIGHT },
  newRestAddress: { fontSize: 11, color: TEXT_LIGHT },
  ratingBadge: { backgroundColor: '#1BA672', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ratingText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // ── Dish card ──
  dishRowWrapper: {
    backgroundColor: WHITE, borderRadius: 16,
    marginHorizontal: 12, marginVertical: 6,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  dishCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 14, gap: 12, backgroundColor: WHITE, borderRadius: 16,
  },
  dishInfo: { flex: 1, gap: 4 },
  vegBox: { width: 18, height: 18, borderRadius: 3, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  dishName: { fontSize: 15, fontWeight: '700', color: TEXT_DARK, lineHeight: 20 },
  dishRestRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dishRestName: { fontSize: 12, fontWeight: '600', color: TEXT_MID, flex: 1 },
  dishPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dishPrice: { fontSize: 15, fontWeight: '800', color: TEXT_DARK },
  dishImgWrap: { width: CARD_IMG, alignItems: 'center' },
  dishImgBox: { width: CARD_IMG, height: CARD_IMG, borderRadius: CARD_IMG_RADIUS },
  dishImgPlaceholder: { backgroundColor: '#FFF0E6', justifyContent: 'center', alignItems: 'center' },
  dishEmoji: { fontSize: 42 },
  addBtn: {
    marginTop: 8, width: CARD_IMG, paddingVertical: 7,
    borderRadius: 50, borderWidth: 1.5, borderColor: PRIMARY,
    backgroundColor: WHITE, alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  addBtnText: { fontSize: 14, fontWeight: '800', color: PRIMARY },
  stepper: {
    marginTop: 8, flexDirection: 'row', alignItems: 'center',
    backgroundColor: PRIMARY, borderRadius: 50, width: CARD_IMG, overflow: 'hidden',
  },
  stepBtn: { width: 36, height: 34, justifyContent: 'center', alignItems: 'center' },
  stepBtnText: { color: WHITE, fontSize: 20, fontWeight: '700', lineHeight: 24 },
  stepCount: { flex: 1, textAlign: 'center', color: WHITE, fontSize: 15, fontWeight: '800' },

  // ── Pre-search ──
  suggestions: { flex: 1, padding: 16 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  clearText: { fontSize: 13, color: PRIMARY, fontWeight: '600' },
  emptyRecent: { fontSize: 13, color: '#9CA3AF', marginBottom: 20 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  recentChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 999, borderWidth: 1, borderColor: BORDER, maxWidth: 180,
  },
  recentText: { fontSize: 13, color: '#374151', flexShrink: 1 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCard: { width: '46.5%', padding: 14, borderRadius: 14, alignItems: 'center', gap: 8 },
  catIconCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  catEmoji: { fontSize: 28 },
  catName: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  // ── Cart bar ──
  cartBar: {
    position: 'absolute', bottom: 12, left: 12, right: 12,
    backgroundColor: PRIMARY, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    ...Platform.select({
      ios: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
  cartLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cartBadge: { width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.20)', justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: WHITE, fontSize: 15, fontWeight: '800' },
  cartInfo: { flex: 1 },
  cartItemsText: { color: WHITE, fontSize: 13, fontWeight: '700' },
  cartRestName: { color: 'rgba(255,255,255,0.80)', fontSize: 11, fontWeight: '500', marginTop: 1 },
  cartRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cartPrice: { color: WHITE, fontSize: 15, fontWeight: '800', textAlign: 'right' },
  cartTaxes: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '500', textAlign: 'right' },

  // ── Sort sheet ──
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheetContainer: { backgroundColor: WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 12 },
  sheetOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  sheetOptionText: { fontSize: 15, color: '#374151', flex: 1 },
  sheetOptionActive: { color: PRIMARY, fontWeight: '700' },

  // ── Cart conflict modal ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalSheet: { backgroundColor: WHITE, borderRadius: 20, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, width: '100%', elevation: 20 },
  modalClose: { position: 'absolute', top: 12, right: 12, padding: 4 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 8, marginTop: 4, paddingRight: 24 },
  modalMessage: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 24 },
  modalRestName: { fontWeight: '700', color: '#111' },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtnNo: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#FFF3E0', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFCC80' },
  modalBtnNoText: { fontSize: 14, fontWeight: '700', color: PRIMARY },
  modalBtnReplace: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: PRIMARY, alignItems: 'center' },
  modalBtnReplaceText: { fontSize: 14, fontWeight: '700', color: WHITE },
});