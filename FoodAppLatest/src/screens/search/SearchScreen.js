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

import { useTheme } from '../../hooks/useTheme';
import { useUserStore } from '../../store/userStore';
import { EmptyState } from '../../components/common/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';
import { CATEGORIES } from '../../constants/categories';
import api from '../../services/api/base';
import { useCart } from '../../hooks/useCart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STORAGE_KEY = 'foodbridge_recent_searches';
const MAX_RECENT = 8;
const MIN_QUERY = 2;

const FILTER_MODE = {
  RESTAURANTS: 'restaurants',
  DISHES: 'dishes',
};

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

function parseCuisines(cuisines) {
  if (!cuisines) return [];
  if (Array.isArray(cuisines)) return cuisines;
  try { return JSON.parse(cuisines); } catch { return []; }
}

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

const SkeletonDishCard = () => {
  const C = useTheme();
  const s = useMemo(() => createS(C), [C]);
  const opacity = useShimmer();
  return (
    <Animated.View style={[s.dishCard, { opacity }]}>
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ height: 8, width: 18, borderRadius: 2, backgroundColor: C.shimmer1 }} />
        <View style={{ height: 14, width: '70%', borderRadius: 4, backgroundColor: C.shimmer1 }} />
        <View style={{ height: 11, width: '40%', borderRadius: 4, backgroundColor: C.shimmer1 }} />
        <View style={{ height: 13, width: '30%', borderRadius: 4, backgroundColor: C.shimmer1 }} />
      </View>
      <View style={[s.dishImgBox, { backgroundColor: C.shimmer1 }]} />
    </Animated.View>
  );
};

const SkeletonRestCard = () => {
  const C = useTheme();
  const s = useMemo(() => createS(C), [C]);
  const opacity = useShimmer();
  return (
    <Animated.View style={[s.newRestCard, { opacity }]}>
      <View style={[s.newRestImageWrap, { backgroundColor: C.shimmer1 }]} />
      <View style={{ flex: 1, gap: 9 }}>
        <View style={{ height: 14, width: '60%', borderRadius: 4, backgroundColor: C.shimmer1 }} />
        <View style={{ height: 11, width: '40%', borderRadius: 4, backgroundColor: C.shimmer1 }} />
        <View style={{ height: 11, width: '70%', borderRadius: 4, backgroundColor: C.shimmer1 }} />
      </View>
    </Animated.View>
  );
};

const VegDot = ({ dietaryTag }) => {
  const C = useTheme();
  const s = useMemo(() => createS(C), [C]);
  const tag = dietaryTag?.toLowerCase();
  const isVeg = tag === 'veg' || tag === 'vegan';
  const color = isVeg ? C.vegGreen : C.nonVegRed;
  return (
    <View style={[s.vegBox, { borderColor: color }]}>
      <View style={[s.vegDot, { backgroundColor: color }]} />
    </View>
  );
};

const SearchBar = memo(({ value, onChangeText, onClear, onSubmitEditing, inputRef }) => {
  const C = useTheme();
  const s = useMemo(() => createS(C), [C]);
  return (
    <View style={s.searchBar}>
      <Icon name="search" size={18} color={C.textLight} />
      <TextInput
        ref={inputRef}
        style={s.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder="Search for restaurants and food"
        placeholderTextColor={C.textLight}
        autoFocus
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="cancel" size={18} color={C.textLight} />
        </TouchableOpacity>
      )}
    </View>
  );
});

const FilterChip = memo(({ label, icon, active, onPress }) => {
  const C = useTheme();
  const s = useMemo(() => createS(C), [C]);
  return (
    <TouchableOpacity
      style={[s.filterChip, active && s.filterChipActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[s.filterChipText, active && s.filterChipTextActive]}>
        {label}
      </Text>
      {icon
        ? <Icon name={icon} size={15} color={active ? C.white : C.textSecondary} />
        : active && <Icon name="close" size={12} color={C.white} style={{ marginLeft: 2 }} />
      }
    </TouchableOpacity>
  );
});

const PRICE_RANGE_OPTIONS = [
  { label: 'Any price', value: null },
  { label: 'Under \u20B9100', value: 100 },
  { label: 'Under \u20B9200', value: 200 },
  { label: 'Under \u20B9300', value: 300 },
  { label: 'Under \u20B9500', value: 500 },
  { label: 'Under \u20B9800', value: 800 },
];

const SortSheet = ({ visible, currentSort, options, isDishSection, currentMaxPrice, onSelect, onPriceSelect, onClose }) => {
  const C = useTheme();
  const s = useMemo(() => createS(C), [C]);
  return (
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
              {currentSort === opt.id && <Icon name="check" size={18} color={C.primary} />}
            </TouchableOpacity>
          ))}

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
                  {currentMaxPrice === opt.value && <Icon name="check" size={18} color={C.primary} />}
                </TouchableOpacity>
              ))}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const CARD_IMG = 110;
const CARD_IMG_RADIUS = 12;

const DishCard = memo(({ dish, quantity, onAdd, onRemove }) => {
  const C = useTheme();
  const s = useMemo(() => createS(C), [C]);
  const hasImg = !!dish.image_url;
  return (
    <View style={s.dishCard}>
      <View style={s.dishInfo}>
        <VegDot dietaryTag={dish.dietary_tag} />
        <Text style={s.dishName} numberOfLines={2}>{dish.name}</Text>
        {dish.restaurant_name ? (
          <View style={s.dishRestRow}>
            <Icon name="near-me" size={11} color={C.textLight} />
            <Text style={s.dishRestName} numberOfLines={1}>{dish.restaurant_name}</Text>
          </View>
        ) : null}
        <View style={s.dishPriceRow}>
          <Text style={s.dishPrice}>
            {'\u20B9'}{Number(dish.price || dish.base_price || 0).toFixed(0)}
          </Text>
        </View>
      </View>
      <View style={s.dishImgWrap}>
        {hasImg ? (
          <Image source={{ uri: dish.image_url }} style={s.dishImgBox} resizeMode="cover" />
        ) : (
          <View style={[s.dishImgBox, s.dishImgPlaceholder]}>
            <Text style={s.dishEmoji}>{'\uD83C\uDF7D\uFE0F'}</Text>
          </View>
        )}
        {quantity > 0 ? (
          <View style={s.stepper}>
            <TouchableOpacity style={s.stepBtn} onPress={onRemove} activeOpacity={0.8}>
              <Text style={s.stepBtnText}>{'\u2212'}</Text>
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

const RestaurantRowCard = memo(({ item, onPress }) => {
  const C = useTheme();
  const s = useMemo(() => createS(C), [C]);
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
          <View style={[s.newRestImage, { backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 24 }}>{'\uD83C\uDF7D\uFE0F'}</Text>
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
          <Text style={[s.newRestName, isClosed && { color: C.textLight }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.avg_rating > 0 && (
            <View style={s.ratingBadge}>
              <Text style={s.ratingText}>{'\u2B50'} {Number(item.avg_rating).toFixed(1)}</Text>
            </View>
          )}
        </View>
        <Text style={s.newRestMeta}>
          {deliveryTime}{'\u2013'}{deliveryTime + 5} mins {'\u00B7'} {item.delivery_fee === 0 ? 'Free delivery' : '\u20B9' + Number(item.delivery_fee || 0).toFixed(0) + ' delivery'}
        </Text>
        {cuisines ? <Text style={s.newRestCuisine} numberOfLines={1}>{cuisines}</Text> : null}
        {item.address_line ? <Text style={s.newRestAddress} numberOfLines={1}>{item.address_line}</Text> : null}
      </View>
    </TouchableOpacity>
  );
});

const SectionHeader = memo(({ title, count, sortLabel, sortActive, onSortPress, filterChips }) => {
  const C = useTheme();
  const s = useMemo(() => createS(C), [C]);
  return (
    <View style={s.sectionHeaderWrap}>
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterScroll}
      >
        <FilterChip
          label={sortLabel}
          icon="keyboard-arrow-down"
          active={sortActive}
          onPress={onSortPress}
        />
        {filterChips}
      </ScrollView>
    </View>
  );
});

const PreSearchView = memo(({ recentSearches, onClear, onSuggestionTap }) => {
  const C = useTheme();
  const s = useMemo(() => createS(C), [C]);
  return (
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
                <Icon name="history" size={14} color={C.textSecondary} style={{ marginRight: 6 }} />
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
  );
});

const CartBar = memo(({ itemCount, total, restaurantName, onPress }) => {
  const C = useTheme();
  const s = useMemo(() => createS(C), [C]);
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
          <Text style={s.cartPrice}>{'\u20B9'}{Number(total).toFixed(0)}</Text>
          <Text style={s.cartTaxes}>+ taxes</Text>
        </View>
        <Icon name="chevron-right" size={24} color={C.white} />
      </View>
    </TouchableOpacity>
  );
});

const CartConflictModal = memo(({ visible, cartRestaurantName, pendingRestaurantName, onCancel, onConfirm }) => {
  const C = useTheme();
  const s = useMemo(() => createS(C), [C]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onCancel}>
        <TouchableOpacity style={s.modalSheet} activeOpacity={1} onPress={() => { }}>
          <TouchableOpacity style={s.modalClose} onPress={onCancel}>
            <Icon name="close" size={20} color={C.textSecondary} />
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
  );
});

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

  const Colors = useTheme();
  const darkMode = useUserStore(s => s.darkMode);
  const s = useMemo(() => createS(Colors), [Colors]);

  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [restResults, setRestResults] = useState([]);
  const [dishResults, setDishResults] = useState([]);
  const [isLoadingRest, setIsLoadingRest] = useState(false);
  const [isLoadingDish, setIsLoadingDish] = useState(false);
  const [error, setError] = useState('');

  const [showSortSheet, setShowSortSheet] = useState(false);
  const [activeSortSection, setActiveSortSection] = useState(FILTER_MODE.RESTAURANTS);

  const [conflictModal, setConflictModal] = useState(false);
  const [pendingDish, setPendingDish] = useState(null);
  const [pendingRestaurantId, setPendingRestaurantId] = useState(null);
  const [pendingRestaurantName, setPendingRestaurantName] = useState(null);

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

  useEffect(() => {
    const incomingQuery = route?.params?.query;
    const autoFill = route?.params?.autoFill;
    if (incomingQuery && autoFill) setQuery(incomingQuery);
  }, [route?.params?.query, route?.params?.autoFill]);

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
  }, [debounced, restFilters]);

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
  }, [debounced, dishFilters]);

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

  const restSortLabel = useMemo(() =>
    RESTAURANT_SORT_OPTIONS.find(o => o.id === restFilters.sort)?.label ?? 'Sort',
    [restFilters.sort]);

  const dishSortLabel = useMemo(() =>
    DISH_SORT_OPTIONS.find(o => o.id === dishFilters.sort)?.label ?? 'Sort',
    [dishFilters.sort]);

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
  }, [handleAddDish, handleRemoveDish, getQuantityForItem, s]);

  const renderRestItem = useCallback(({ item }) => (
    <RestaurantRowCard item={item} onPress={() => handleRestaurantPress(item)} />
  ), [handleRestaurantPress]);

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

  const dishFilterChips = useMemo(() => (
    <>
      <FilterChip
        label="Veg Only"
        active={dishFilters.veg}
        onPress={() => toggleDishFilter('veg')}
      />
      {dishFilters.maxPrice != null && (
        <FilterChip
          label={`Under \u20B9${dishFilters.maxPrice}`}
          active
          onPress={() => setDishFilters(p => ({ ...p, maxPrice: null }))}
        />
      )}
    </>
  ), [dishFilters, toggleDishFilter]);

  const renderCombinedResults = () => {
    const restLoading = isLoadingRest;
    const dishLoading = isLoadingDish;
    const hasRest = restResults.length > 0;
    const hasDish = dishResults.length > 0;
    const bothDone = !restLoading && !dishLoading;
    const nothingFound = bothDone && !hasRest && !hasDish;

    if (nothingFound) {
      return (
        <EmptyState
          emoji={'\uD83D\uDD0D'}
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

        <View style={s.sectionDivider}>
          <View style={s.sectionDividerLine} />
          <View style={s.sectionDividerPill}>
            <Icon name="restaurant-menu" size={14} color={Colors.textSecondary} />
            <Text style={s.sectionDividerText}>Dishes</Text>
          </View>
          <View style={s.sectionDividerLine} />
        </View>

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
          emoji={'\u26A0\uFE0F'}
          title="Something went wrong"
          subtitle={error}
          buttonTitle="Try Again"
          onButtonPress={() => setQuery(q => q)}
        />
      );
    }

    return renderCombinedResults();
  };

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
      <StatusBar backgroundColor={Colors.surface} barStyle={darkMode ? 'light-content' : 'dark-content'} />

      <View style={s.searchRow}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-back" size={22} color={Colors.textPrimary} />
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

const createS = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
    ...Platform.select({
      ios: { shadowColor: C.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  backBtn: { padding: 4 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.background, borderRadius: 10,
    paddingHorizontal: 12, height: 44,
    gap: 8, borderWidth: 1.5, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: C.textPrimary, padding: 0 },

  sectionHeaderWrap: {
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 14,
    marginBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 8,
  },
  sectionTitleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  sectionBadge: {
    backgroundColor: C.primary + '18', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  sectionBadgeText: { fontSize: 12, fontWeight: '700', color: C.primary },

  sectionDivider: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginVertical: 18, gap: 10,
  },
  sectionDividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  sectionDividerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: C.surface, borderRadius: 999,
    borderWidth: 1, borderColor: C.border,
  },
  sectionDividerText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },

  sectionEmpty: {
    paddingHorizontal: 16, paddingVertical: 20, alignItems: 'center',
  },
  sectionEmptyText: { fontSize: 13, color: C.textLight, fontStyle: 'italic' },

  filterScroll: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
  },
  filterChipActive: { backgroundColor: C.black, borderColor: C.black },
  filterChipText: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  filterChipTextActive: { color: C.white },

  newRestCard: {
    flexDirection: 'row', backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.divider,
    marginHorizontal: 12, marginVertical: 6,
    padding: 12, borderRadius: 14, gap: 12,
    ...Platform.select({
      ios: { shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  newRestImageWrap: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden' },
  newRestImage: { width: '100%', height: '100%' },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlayMedium,
    justifyContent: 'center', alignItems: 'center', borderRadius: 12,
  },
  closedOverlayText: { color: C.white, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  newRestContent: { flex: 1, justifyContent: 'center', gap: 3 },
  newRestName: { fontSize: 15, fontWeight: '700', color: C.textPrimary, flex: 1, marginRight: 4 },
  newRestMeta: { fontSize: 12, color: C.textSecondary },
  newRestCuisine: { fontSize: 12, color: C.textLight },
  newRestAddress: { fontSize: 11, color: C.textLight },
  ratingBadge: { backgroundColor: C.ratingGreen, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ratingText: { color: C.white, fontSize: 11, fontWeight: '700' },

  dishRowWrapper: {
    backgroundColor: C.surface, borderRadius: 16,
    marginHorizontal: 12, marginVertical: 6,
    ...Platform.select({
      ios: { shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  dishCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 14, gap: 12, backgroundColor: C.surface, borderRadius: 16,
  },
  dishInfo: { flex: 1, gap: 4 },
  vegBox: { width: 18, height: 18, borderRadius: 3, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  dishName: { fontSize: 15, fontWeight: '700', color: C.textPrimary, lineHeight: 20 },
  dishRestRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dishRestName: { fontSize: 12, fontWeight: '600', color: C.textSecondary, flex: 1 },
  dishPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dishPrice: { fontSize: 15, fontWeight: '800', color: C.textPrimary },
  dishImgWrap: { width: CARD_IMG, alignItems: 'center' },
  dishImgBox: { width: CARD_IMG, height: CARD_IMG, borderRadius: CARD_IMG_RADIUS },
  dishImgPlaceholder: { backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  dishEmoji: { fontSize: 42 },
  addBtn: {
    marginTop: 8, width: CARD_IMG, paddingVertical: 7,
    borderRadius: 50, borderWidth: 1.5, borderColor: C.primary,
    backgroundColor: C.surface, alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  addBtnText: { fontSize: 14, fontWeight: '800', color: C.primary },
  stepper: {
    marginTop: 8, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.primary, borderRadius: 50, width: CARD_IMG, overflow: 'hidden',
  },
  stepBtn: { width: 36, height: 34, justifyContent: 'center', alignItems: 'center' },
  stepBtnText: { color: C.white, fontSize: 20, fontWeight: '700', lineHeight: 24 },
  stepCount: { flex: 1, textAlign: 'center', color: C.white, fontSize: 15, fontWeight: '800' },

  suggestions: { flex: 1, padding: 16 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  clearText: { fontSize: 13, color: C.primary, fontWeight: '600' },
  emptyRecent: { fontSize: 13, color: C.textLight, marginBottom: 20 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  recentChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 999, borderWidth: 1, borderColor: C.border, maxWidth: 180,
  },
  recentText: { fontSize: 13, color: C.textPrimary, flexShrink: 1 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCard: { width: '46.5%', padding: 14, borderRadius: 14, alignItems: 'center', gap: 8 },
  catIconCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  catEmoji: { fontSize: 28 },
  catName: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  cartBar: {
    position: 'absolute', bottom: 12, left: 12, right: 12,
    backgroundColor: C.primary, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    ...Platform.select({
      ios: { shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
  cartLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cartBadge: { width: 34, height: 34, borderRadius: 8, backgroundColor: C.overlayLight, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: C.white, fontSize: 15, fontWeight: '800' },
  cartInfo: { flex: 1 },
  cartItemsText: { color: C.white, fontSize: 13, fontWeight: '700' },
  cartRestName: { color: 'rgba(255,255,255,0.80)', fontSize: 11, fontWeight: '500', marginTop: 1 },
  cartRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cartPrice: { color: C.white, fontSize: 15, fontWeight: '800', textAlign: 'right' },
  cartTaxes: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '500', textAlign: 'right' },

  sheetOverlay: { flex: 1, backgroundColor: C.overlayMedium, justifyContent: 'flex-end' },
  sheetContainer: { backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
  sheetOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.divider },
  sheetOptionText: { fontSize: 15, color: C.textPrimary, flex: 1 },
  sheetOptionActive: { color: C.primary, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: C.overlayDense, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalSheet: { backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, width: '100%', elevation: 20 },
  modalClose: { position: 'absolute', top: 12, right: 12, padding: 4 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.textPrimary, marginBottom: 8, marginTop: 4, paddingRight: 24 },
  modalMessage: { fontSize: 13, color: C.textSecondary, lineHeight: 20, marginBottom: 24 },
  modalRestName: { fontWeight: '700', color: C.textPrimary },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtnNo: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', borderWidth: 1.5, borderColor: C.primaryLight },
  modalBtnNoText: { fontSize: 14, fontWeight: '700', color: C.primary },
  modalBtnReplace: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
  modalBtnReplaceText: { fontSize: 14, fontWeight: '700', color: C.white },
});
