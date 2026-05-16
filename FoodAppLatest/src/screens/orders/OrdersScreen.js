import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { formatCurrency } from '../../utils/formatCurrency';
import { useOrders } from '../../hooks/useOrders';
import { useOrderStore } from '../../store/orderStore';
import { useCartStore } from '../../store/cartStore';

// ─── Constants ────────────────────────────────────────────
const STATUS_MAP = {
  placed: 'Placed',
  confirmed: 'Confirmed',        // ← was 'accepted' ❌
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup', // ← was 'ready' ❌
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'active', label: 'Active' },
  { id: 'past', label: 'Past' },
];

const STATUS_STYLE = {
  Placed: { color: '#3498DB', bg: '#EBF5FB', icon: 'receipt-long' },
  Confirmed: { color: '#9B59B6', bg: '#F5EEF8', icon: 'check-circle' }, // ← was 'Accepted' ❌
  Preparing: { color: '#E67E22', bg: '#FEF9E7', icon: 'restaurant' },
  'Ready for Pickup': { color: '#F39C12', bg: '#FEF9E7', icon: 'hourglass-empty' }, // ← was 'Waiting...' ❌
  'Out for Delivery': { color: Colors.primary, bg: Colors.primaryLight, icon: 'delivery-dining' },
  Delivered: { color: Colors.success, bg: '#EAFAF1', icon: 'check-circle' },
  Cancelled: { color: Colors.error, bg: '#FDEDEC', icon: 'cancel' },
};

const ACTIVE_STATUSES = [
  'Placed', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery',
];

// ── Filter definitions ────────────────────────────────────
const STATUS_FILTER_OPTIONS = [
  { id: 'Delivered', label: 'Delivered', icon: 'check-circle' },
  { id: 'Cancelled', label: 'Cancelled', icon: 'cancel' },
  { id: 'Preparing', label: 'Preparing', icon: 'restaurant' },
  { id: 'Out for Delivery', label: 'Out for Delivery', icon: 'delivery-dining' },
];

const DATE_PRESETS = [
  { id: 'all_time', label: 'All Time', days: null },
  { id: 'today', label: 'Today', days: 0 },
  { id: 'week', label: 'This Week', days: 7 },
  { id: 'month', label: 'This Month', days: 30 },
  { id: 'three_months', label: 'Last 3 Months', days: 90 },
];

// ─── Helpers ──────────────────────────────────────────────
const isWithinDays = (dateStr, days) => {
  if (days === null) return true;
  const orderDate = new Date(dateStr);
  const now = new Date();
  if (days === 0) {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    return orderDate >= startOfDay;
  }
  return orderDate >= new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
};

const countActiveFilters = (statusFilter, dateFilter) => {
  let n = 0;
  if (statusFilter !== 'all_status') n++;
  if (dateFilter !== 'all_time') n++;
  return n;
};

// ─── Status Badge ─────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.Placed;
  return (
    <View style={[chipStyles.badge, { backgroundColor: s.bg }]}>
      <Icon name={s.icon} size={12} color={s.color} />
      <Text style={[chipStyles.badgeText, { color: s.color }]}>{status}</Text>
    </View>
  );
};

// ─── Filter Chips Row ─────────────────────────────────────
const FilterChipsRow = ({ statusFilter, setStatusFilter, dateFilter, setDateFilter, onClearAll }) => {
  const activeCount = countActiveFilters(statusFilter, dateFilter);

  return (
    <View style={chipStyles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={chipStyles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Clear all — only when filters active */}
        {activeCount > 0 && (
          <TouchableOpacity style={chipStyles.clearChip} onPress={onClearAll} activeOpacity={0.75}>
            <Icon name="close" size={13} color={Colors.error} />
            <Text style={chipStyles.clearText}>Clear ({activeCount})</Text>
          </TouchableOpacity>
        )}

        {/* Date presets */}
        {DATE_PRESETS.filter(p => p.id !== 'all_time').map((preset) => {
          const active = dateFilter === preset.id;
          return (
            <TouchableOpacity
              key={preset.id}
              style={[chipStyles.chip, active && chipStyles.chipActive]}
              onPress={() => setDateFilter(active ? 'all_time' : preset.id)}
              activeOpacity={0.75}
            >
              <Icon name="date-range" size={13} color={active ? Colors.white : Colors.textSecondary} />
              <Text style={[chipStyles.chipText, active && chipStyles.chipTextActive]}>
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Divider */}
        <View style={chipStyles.divider} />

        {/* Status chips */}
        {STATUS_FILTER_OPTIONS.map((f) => {
          const active = statusFilter === f.id;
          const ss = STATUS_STYLE[f.id];
          return (
            <TouchableOpacity
              key={f.id}
              style={[
                chipStyles.chip,
                active
                  ? { backgroundColor: ss?.color ?? Colors.primary, borderColor: ss?.color ?? Colors.primary }
                  : { borderColor: (ss?.color ?? Colors.border) + '66' },
              ]}
              onPress={() => setStatusFilter(active ? 'all_status' : f.id)}
              activeOpacity={0.75}
            >
              <Icon
                name={f.icon}
                size={13}
                color={active ? Colors.white : ss?.color ?? Colors.textSecondary}
              />
              <Text style={[
                chipStyles.chipText,
                active ? chipStyles.chipTextActive : { color: ss?.color ?? Colors.textSecondary },
              ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ─── Active Order Banner ──────────────────────────────────
const ActiveOrderBanner = ({ order, onPress }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.03, duration: 700, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);
  const mappedStatus = STATUS_MAP[order.order_status] ?? order.order_status ?? 'Placed';
  const ss = STATUS_STYLE[mappedStatus] ?? STATUS_STYLE.Placed;
  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        style={[styles.activeBanner, { borderColor: ss.color }]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={[styles.activeBannerLeft, { backgroundColor: ss.bg }]}>
          <Icon name={ss.icon} size={28} color={ss.color} />
        </View>
        <View style={styles.activeBannerInfo}>
          <Text style={styles.activeBannerTitle}>Order in Progress</Text>
          <Text style={styles.activeBannerRest} numberOfLines={1}>
            {order.restaurantName ?? 'Restaurant'}
          </Text>
          <StatusBadge status={mappedStatus} />
        </View>
        <View style={styles.activeBannerTrack}>
          <Text style={[styles.trackText, { color: ss.color }]}>Track</Text>
          <Icon name="arrow-forward-ios" size={12} color={ss.color} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Order Card ───────────────────────────────────────────
const OrderCard = ({ order, onPress, onReorder, isReordering }) => {
  const scaleAnim = useRef(new Animated.Value(0.97)).current;
  React.useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }).start();
  }, []);

  const mappedStatus = STATUS_MAP[order.order_status] ?? order.order_status ?? 'Placed';
  const orderAge = Date.now() - new Date(order.placed_at || order.created_at).getTime();
  const isActive = ACTIVE_STATUSES.includes(mappedStatus) && orderAge < 2 * 60 * 60 * 1000;
  const isDelivered = mappedStatus === 'Delivered';
  const ss = STATUS_STYLE[mappedStatus] ?? STATUS_STYLE.Placed;
  const itemNames = order.items?.map(i => i.name ?? i.item_name_snapshot).filter(Boolean).join(', ');

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity style={styles.orderCard} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.orderCardHeader}>
          {order.restaurantImage ? (
            <Image source={{ uri: order.restaurantImage }} style={styles.restThumb} />
          ) : (
            <View style={[styles.restThumb, styles.restThumbFallback]}>
              <Icon name="restaurant" size={22} color={Colors.textLight} />
            </View>
          )}
          <View style={styles.orderCardHeaderInfo}>
            <Text style={styles.orderRestName} numberOfLines={1}>
              {order.restaurantName ?? 'Restaurant'}
            </Text>
            <Text style={styles.orderDate}>
              {new Date(order.placed_at || order.created_at).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
          <StatusBadge status={mappedStatus} />
        </View>

        <View style={styles.orderItems}>
          <Icon name="receipt" size={14} color={Colors.textLight} />
          <Text style={styles.orderItemsText} numberOfLines={2}>
            {itemNames || 'Items not available'}
          </Text>
        </View>

        <View style={styles.orderCardFooter}>
          <View style={styles.orderFooterLeft}>
            <Text style={styles.orderTotal}>
              {formatCurrency(Number(order.total_amount ?? order.total ?? 0))}
            </Text>
            <View style={styles.orderDot} />
            <Text style={styles.orderCount}>
              {order.items?.length ?? 0}{' '}
              {(order.items?.length ?? 0) === 1 ? 'item' : 'items'}
            </Text>
          </View>
          <View style={styles.orderActions}>
            {isActive ? (
              <TouchableOpacity
                style={[styles.orderActionBtn, { borderColor: ss.color }]}
                onPress={onPress}
              >
                <Icon name="gps-fixed" size={14} color={ss.color} />
                <Text style={[styles.orderActionText, { color: ss.color }]}>Track</Text>
              </TouchableOpacity>
            ) : isDelivered ? (
              <TouchableOpacity
                style={[styles.reorderBtn, isReordering && { opacity: 0.6 }]}
                onPress={onReorder}
                disabled={isReordering}
              >
                {isReordering
                  ? <ActivityIndicator size={14} color={Colors.primary} />
                  : <Icon name="replay" size={14} color={Colors.primary} />}
                <Text style={styles.reorderText}>{isReordering ? 'Adding...' : 'Reorder'}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.detailBtn} onPress={onPress}>
              <Text style={styles.detailBtnText}>Details</Text>
              <Icon name="arrow-forward-ios" size={11} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Filter Empty State ───────────────────────────────────
const FilterEmptyState = ({ onClear }) => (
  <View style={styles.filterEmpty}>
    <Text style={styles.filterEmptyEmoji}>🔍</Text>
    <Text style={styles.filterEmptyTitle}>No orders match</Text>
    <Text style={styles.filterEmptySub}>Try adjusting or clearing your filters</Text>
    <TouchableOpacity style={styles.filterEmptyBtn} onPress={onClear}>
      <Icon name="filter-list-off" size={15} color={Colors.primary} />
      <Text style={styles.filterEmptyBtnText}>Clear Filters</Text>
    </TouchableOpacity>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────
export const OrdersScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all_status');
  const [dateFilter, setDateFilter] = useState('all_time');
  const [reorderingId, setReorderingId] = useState(null);
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  const { data, isLoading, refetch, isRefetching } = useOrders();
  const orders = Array.isArray(data) ? data : [];

  const activeOrder = orders.find(o => {
    const s = STATUS_MAP[o.order_status] ?? o.order_status ?? '';
    return ACTIVE_STATUSES.includes(s);
  });

  // ── Filtered + sorted orders ──────────────────────────
  const filteredOrders = useMemo(() => {
    const datePreset = DATE_PRESETS.find(p => p.id === dateFilter);
    return orders
      .filter(o => {
        const s = STATUS_MAP[o.order_status] ?? o.order_status ?? '';

        // Tab
        if (activeTab === 'active') return activeOrder && o.id === activeOrder.id;
        if (activeTab === 'past') return ['Delivered', 'Cancelled'].includes(s);
        if (activeTab === 'all' && activeOrder && o.id === activeOrder.id) return false;

        // Status chip
        if (statusFilter !== 'all_status' && s !== statusFilter) return false;

        // Date chip
        if (!isWithinDays(o.placed_at || o.created_at, datePreset?.days ?? null)) return false;

        return true;
      })
      .sort((a, b) =>
        new Date(b.placed_at || b.created_at) - new Date(a.placed_at || a.created_at)
      );
  }, [orders, activeTab, statusFilter, dateFilter, activeOrder]);

  const activeFilterCount = countActiveFilters(statusFilter, dateFilter);

  const clearAllFilters = useCallback(() => {
    setStatusFilter('all_status');
    setDateFilter('all_time');
  }, []);

  // ── Reorder ───────────────────────────────────────────
  const handleReorder = useCallback(async (order) => {
    const { items, restaurantName } = order;
    const rid = order.restaurantId ?? order.restaurant_id;

    if (!items?.length) { Alert.alert('Cannot Reorder', 'No items found.'); return; }
    if (!rid) { Alert.alert('Cannot Reorder', 'Restaurant information is missing.'); return; }

    const cartStore = useCartStore.getState();
    const conflict = cartStore.items.length > 0 && cartStore.restaurantId !== rid;

    const doAdd = () => {
      setReorderingId(order.id);
      try {
        cartStore.clearCart();
        items.forEach((item) => {
          const dish = {
            id: item.menu_item_id ?? item.id,
            name: item.name ?? item.item_name_snapshot,
            base_price: item.unit_price_snapshot ?? item.price ?? 0,
            price: item.unit_price_snapshot ?? item.price ?? 0,
            image_url: item.image ?? null,
            dietary_tag: item.dietary_tag ?? null,
          };
          const qty = item.quantity ?? 1;
          cartStore.addItem(dish, rid, restaurantName ?? 'Restaurant');
          for (let i = 1; i < qty; i++) {
            cartStore.addItem(dish, rid, restaurantName ?? 'Restaurant');
          }
        });
        navigation.navigate('CartScreen');
      } catch (e) {
        Alert.alert('Error', 'Failed to add items to cart.');
      } finally {
        setReorderingId(null);
      }
    };

    if (conflict) {
      Alert.alert(
        'Replace Cart?',
        `Your cart has items from "${cartStore.restaurantName}". Replace with "${restaurantName ?? order.restaurantName}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Replace', style: 'destructive', onPress: doAdd },
        ]
      );
    } else {
      doAdd();
    }
  }, [navigation]);

  // ── Tab switch ────────────────────────────────────────
  const switchTab = (id, index) => {
    setActiveTab(id);
    clearAllFilters();
    Animated.spring(tabIndicatorAnim, {
      toValue: index, friction: 8, tension: 60, useNativeDriver: false,
    }).start();
  };

  const tabWidth = 120;
  const indicatorLeft = tabIndicatorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [4, tabWidth + 4, tabWidth * 2 + 4],
  });

  const ListHeader = useCallback(() => (
    <View>
      {activeOrder && activeTab !== 'past' && (
        <View style={styles.activeBannerWrapper}>
          <ActiveOrderBanner
            order={activeOrder}
            onPress={() => {
              useOrderStore.setState({ currentOrder: activeOrder });
              navigation.navigate('OrderTrackingScreen', { orderId: activeOrder.id });
            }}
          />
        </View>
      )}
      {filteredOrders.length > 0 && (
        <View style={styles.listLabelRow}>
          <Text style={styles.listLabel}>
            {activeTab === 'all' && `All Orders (${filteredOrders.length})`}
            {activeTab === 'active' && 'Active Orders'}
            {activeTab === 'past' && `Past Orders (${filteredOrders.length})`}
          </Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterActivePill}>
              <Icon name="filter-list" size={12} color={Colors.primary} />
              <Text style={styles.filterActivePillText}>
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  ), [activeOrder, filteredOrders.length, activeTab, activeFilterCount]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Orders</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SearchScreen')} style={styles.headerSearch}>
          <Icon name="search" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabsTrack}>
          <Animated.View style={[styles.tabIndicator, { left: indicatorLeft, width: tabWidth - 8 }]} />
          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, { width: tabWidth }]}
              onPress={() => switchTab(tab.id, index)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Filter chips */}
      <FilterChipsRow
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        onClearAll={clearAllFilters}
      />

      {/* List */}
      {isLoading ? (
        <Loader />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id?.toString()}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              isReordering={reorderingId === item.id}
              onPress={() => {
                const s = STATUS_MAP[item.order_status] ?? item.order_status ?? '';
                if (ACTIVE_STATUSES.includes(s)) {
                  navigation.navigate('OrderTrackingScreen', { orderId: item.id });
                } else {
                  navigation.navigate('OrderDetailScreen', { orderId: item.id });
                }
              }}
              onReorder={() => handleReorder(item)}
            />
          )}
          ListHeaderComponent={<ListHeader />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            activeFilterCount > 0 ? (
              <FilterEmptyState onClear={clearAllFilters} />
            ) : (
              <EmptyState
                emoji="🧾"
                title={activeTab === 'active' ? 'No active orders' : 'No orders yet'}
                subtitle={
                  activeTab === 'active'
                    ? 'You have no ongoing orders right now'
                    : 'Your order history will appear here'
                }
                buttonTitle="Order Now"
                onButtonPress={() => navigation.navigate('HomeScreen')}
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
};

// ─── Chip styles (separate for reuse) ─────────────────────
const chipStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
  },
  scroll: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  divider: { width: 1, height: 20, backgroundColor: Colors.border, marginHorizontal: 2 },
  clearChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#FFF0F0', borderWidth: 1,
    borderColor: (Colors.error ?? '#E53935') + '44',
  },
  clearText: { fontSize: 12, fontWeight: '700', color: Colors.error ?? '#E53935' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
});

// ─── Main styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  headerSearch: { padding: 4 },
  tabsWrapper: {
    backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tabsTrack: {
    flexDirection: 'row', backgroundColor: Colors.background,
    borderRadius: 12, padding: 4, position: 'relative',
  },
  tabIndicator: {
    position: 'absolute', top: 4, bottom: 4, backgroundColor: Colors.white,
    borderRadius: 9, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  tab: { height: 36, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },

  listContent: { paddingBottom: 32 },
  listLabelRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  listLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterActivePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight, paddingHorizontal: 10,
    paddingVertical: 3, borderRadius: 20,
  },
  filterActivePillText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  activeBannerWrapper: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 16, borderWidth: 1.5, overflow: 'hidden', elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6,
  },
  activeBannerLeft: { width: 64, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center' },
  activeBannerInfo: { flex: 1, padding: 14, gap: 4 },
  activeBannerTitle: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  activeBannerRest: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  activeBannerTrack: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingRight: 14 },
  trackText: { fontSize: 13, fontWeight: '700' },

  orderCard: {
    backgroundColor: Colors.white, marginHorizontal: 16, borderRadius: 16,
    padding: 16, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
    marginBottom: 10,
  },
  orderCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  restThumb: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.background },
  restThumbFallback: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  orderCardHeaderInfo: { flex: 1 },
  orderRestName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  orderDate: { fontSize: 11, color: Colors.textLight },
  orderItems: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 12,
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  orderItemsText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  orderCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderFooterLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderTotal: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  orderDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  orderCount: { fontSize: 12, color: Colors.textSecondary },
  orderActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5,
  },
  orderActionText: { fontSize: 12, fontWeight: '700' },
  reorderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: Colors.primaryLight, borderWidth: 1,
    borderColor: Colors.primary + '33', minWidth: 80, justifyContent: 'center',
  },
  reorderText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  detailBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.background,
  },
  detailBtnText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },

  filterEmpty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 10 },
  filterEmptyEmoji: { fontSize: 48 },
  filterEmptyTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  filterEmptySub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  filterEmptyBtn: {
    marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: Colors.primaryLight, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.primary + '33',
  },
  filterEmptyBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
});