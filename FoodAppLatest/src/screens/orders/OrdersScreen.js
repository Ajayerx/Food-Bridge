import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
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
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { formatCurrency } from '../../utils/formatCurrency';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { socket } from '../../services/socket/socket';
import { useOrderStore } from '../../store/orderStore';
import { useCartStore } from '../../store/cartStore';

// ── Safe import: try native date picker ──
let NativeDateTimePicker = null;
try {
  NativeDateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (_e) {
  NativeDateTimePicker = null;
}

const HAS_NATIVE_PICKER = NativeDateTimePicker !== null;

// ─── Constants ────────────────────────────────────────────
const STATUS_MAP = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  Placed: 'Placed',
  Confirmed: 'Confirmed',
  Preparing: 'Preparing',
  ReadyForPickup: 'Ready for Pickup',
  OutForDelivery: 'Out for Delivery',
  Delivered: 'Delivered',
  Completed: 'Delivered',
  Cancelled: 'Cancelled',
  Refunded: 'Refunded',
};

const TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'active', label: 'Active' },
];

const STATUS_STYLE = {
  Placed: { color: '#3498DB', bg: '#EBF5FB', icon: 'receipt-long' },
  Confirmed: { color: '#9B59B6', bg: '#F5EEF8', icon: 'check-circle' },
  Preparing: { color: '#E67E22', bg: '#FEF9E7', icon: 'restaurant' },
  'Ready for Pickup': { color: '#F39C12', bg: '#FEF9E7', icon: 'hourglass-empty' },
  'Out for Delivery': { color: Colors.primary, bg: Colors.primaryLight, icon: 'delivery-dining' },
  Delivered: { color: Colors.success, bg: '#EAFAF1', icon: 'check-circle' },
  Cancelled: { color: Colors.error, bg: '#FDEDEC', icon: 'cancel' },
};

const ACTIVE_STATUSES = [
  'Placed', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery',
];

const STATUS_FILTER_OPTIONS = [
  { id: 'Delivered', label: 'Delivered', icon: 'check-circle' },
  { id: 'Cancelled', label: 'Cancelled', icon: 'cancel' },
];

const DATE_PRESETS = [
  { id: 'all_time', label: 'All Time', days: null },
  { id: 'today', label: 'Today', days: 0 },
  { id: 'yesterday', label: 'Yesterday', days: 'yesterday' },
  { id: 'week', label: 'This Week', days: 'week' },
  { id: 'custom', label: 'Pick Date', days: 'custom' },
];

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Helpers ──────────────────────────────────────────────
const isWithinDays = (dateStr, days, customDate) => {
  if (days === null) return true;
  const orderDate = new Date(dateStr);
  const now = new Date();

  if (days === 0) {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    return orderDate >= startOfDay;
  }

  if (days === 'yesterday') {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    return orderDate >= startOfYesterday && orderDate < startOfToday;
  }

  if (days === 'week') {
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return orderDate >= startOfWeek;
  }

  if (days === 'custom' && customDate) {
    const start = new Date(customDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customDate);
    end.setHours(23, 59, 59, 999);
    return orderDate >= start && orderDate <= end;
  }

  return orderDate >= new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
};

const countActiveFilters = (statusFilter, dateFilter) => {
  let n = 0;
  if (statusFilter !== 'all_status') n++;
  if (dateFilter !== 'all_time' && dateFilter !== '') n++;
  return n;
};

const formatDateShort = (date) => {
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const getMappedStatus = (order) => {
  if (order.status && STATUS_MAP[order.status]) return order.status;
  return STATUS_MAP[order.order_status] ?? order.order_status ?? 'Placed';
};

const isLiveActive = (order) => {
  const s = getMappedStatus(order);
  return ACTIVE_STATUSES.includes(s);
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

// ─── Enhanced Calendar Date Picker Modal ──────────────────
// Production-quality calendar grid — no native dependencies.
// Swiggy/Zomato-style with quick picks, month nav, day grid.
const CalendarDatePickerModal = ({ visible, onConfirm, onCancel, currentDate }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState(currentDate || today);
  const [viewYear, setViewYear] = useState((currentDate || today).getFullYear());
  const [viewMonth, setViewMonth] = useState((currentDate || today).getMonth());

  // Slide animation for month transitions
  const slideAnim = useRef(new Animated.Value(0)).current;
  const slideDir = useRef(1); // 1 = right, -1 = left

  useEffect(() => {
    if (visible) {
      const d = currentDate || new Date();
      setSelectedDate(d);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [visible, currentDate]);

  // Generate calendar grid for the viewed month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sun
    const totalDays = lastDay.getDate();

    const days = [];
    // Padding before 1st
    for (let i = 0; i < startPad; i++) days.push(null);
    // Actual days
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(viewYear, viewMonth, d));
    }
    // Padding to fill last row
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [viewYear, viewMonth]);

  // Week rows for rendering (chunked by 7)
  const weekRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      rows.push(calendarDays.slice(i, i + 7));
    }
    return rows;
  }, [calendarDays]);

  const goToPrevMonth = () => {
    slideDir.current = -1;
    slideAnim.setValue(-1);
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 9,
      tension: 80,
      useNativeDriver: true,
    }).start();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    const next = new Date(viewYear, viewMonth + 1, 1);
    if (next > today) return;
    slideDir.current = 1;
    slideAnim.setValue(1);
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 9,
      tension: 80,
      useNativeDriver: true,
    }).start();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const isToday = (d) => d && d.getTime() === today.getTime();
  const isSelected = (d) => d && selectedDate && d.getTime() === selectedDate.getTime();
  const isFuture = (d) => d && d > today;
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const handleDayPress = (d) => {
    if (!d || isFuture(d)) return;
    setSelectedDate(d);
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  const handleQuickPick = (date) => {
    setSelectedDate(date);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  };

  const monthLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

  // Yesterday date helper
  const yesterday = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return d;
  }, []);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={calStyles.overlay}>
        <TouchableOpacity
          style={calStyles.overlayTouch}
          activeOpacity={1}
          onPress={onCancel}
        />
        <View style={calStyles.container}>
          {/* ── Header ── */}
          <View style={calStyles.header}>
            <View style={calStyles.headerLeft}>
              <Icon name="event" size={20} color={Colors.primary} />
              <Text style={calStyles.headerTitle}>Select Date</Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={calStyles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ── Quick picks ── */}
          <View style={calStyles.quickRow}>
            <TouchableOpacity
              style={[
                calStyles.quickChip,
                isToday(selectedDate) && calStyles.quickChipActive,
              ]}
              onPress={() => handleQuickPick(today)}
              activeOpacity={0.7}
            >
              <Text style={[
                calStyles.quickChipText,
                isToday(selectedDate) && calStyles.quickChipTextActive,
              ]}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                calStyles.quickChip,
                selectedDate && yesterday.getTime() === selectedDate.getTime() && calStyles.quickChipActive,
              ]}
              onPress={() => handleQuickPick(yesterday)}
              activeOpacity={0.7}
            >
              <Text style={[
                calStyles.quickChipText,
                selectedDate && yesterday.getTime() === selectedDate.getTime() && calStyles.quickChipTextActive,
              ]}>Yesterday</Text>
            </TouchableOpacity>
          </View>

          {/* ── Divider ── */}
          <View style={calStyles.divider} />

          {/* ── Month Navigation ── */}
          <View style={calStyles.monthNav}>
            <TouchableOpacity onPress={goToPrevMonth} style={calStyles.monthArrow} activeOpacity={0.7}>
              <Icon name="chevron-left" size={26} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={calStyles.monthLabelWrap}>
              <Text style={calStyles.monthLabel}>{monthLabel}</Text>
            </View>
            <TouchableOpacity
              onPress={goToNextMonth}
              style={[calStyles.monthArrow, isCurrentMonth && calStyles.monthArrowDisabled]}
              disabled={isCurrentMonth}
              activeOpacity={0.7}
            >
              <Icon
                name="chevron-right"
                size={26}
                color={isCurrentMonth ? '#D1D5DB' : Colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* ── Weekday headers ── */}
          <View style={calStyles.weekRow}>
            {WEEKDAY_LABELS.map((wd, i) => (
              <View key={i} style={calStyles.weekCell}>
                <Text style={[
                  calStyles.weekText,
                  i === 0 && calStyles.weekTextWeekend,
                  i === 6 && calStyles.weekTextWeekend,
                ]}>
                  {wd}
                </Text>
              </View>
            ))}
          </View>

          {/* ── Calendar grid ── */}
          <View style={calStyles.calendarBody}>
            {weekRows.map((week, wIdx) => (
              <View key={wIdx} style={calStyles.weekDayRow}>
                {week.map((day, dIdx) => {
                  const _isToday = isToday(day);
                  const _isSelected = isSelected(day);
                  const _isFuture = isFuture(day);
                  const empty = !day;

                  return (
                    <TouchableOpacity
                      key={dIdx}
                      style={[
                        calStyles.dayCell,
                        _isSelected && calStyles.dayCellSelected,
                        _isToday && !_isSelected && calStyles.dayCellToday,
                      ]}
                      onPress={() => handleDayPress(day)}
                      disabled={empty || _isFuture}
                      activeOpacity={0.6}
                    >
                      {!empty && (
                        <Text style={[
                          calStyles.dayText,
                          _isToday && !_isSelected && calStyles.dayTextToday,
                          _isSelected && calStyles.dayTextSelected,
                          _isFuture && calStyles.dayTextFuture,
                        ]}>
                          {day.getDate()}
                        </Text>
                      )}
                      {/* Today dot indicator */}
                      {_isToday && !_isSelected && (
                        <View style={calStyles.todayDot} />
                      )}
                      {/* Selected check ring */}
                      {_isSelected && (
                        <View style={calStyles.selectedRing} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* ── Selected date preview + Apply ── */}
          <View style={calStyles.footer}>
            <View style={calStyles.selectedPreview}>
              <Icon name="calendar-today" size={16} color={Colors.primary} />
              <Text style={calStyles.selectedPreviewText}>
                {selectedDate.toLocaleDateString('en-IN', {
                  weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                })}
              </Text>
            </View>
            <TouchableOpacity style={calStyles.applyBtn} onPress={handleConfirm} activeOpacity={0.8}>
              <Text style={calStyles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Native iOS Date Picker Modal ─────────────────────────
const NativeIOSPickerModal = ({ visible, onConfirm, onCancel, currentDate }) => {
  const [tempDate, setTempDate] = useState(currentDate || new Date());

  useEffect(() => {
    if (visible) setTempDate(currentDate || new Date());
  }, [visible, currentDate]);

  if (!NativeDateTimePicker) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={iosPickerStyles.overlay}>
        <TouchableOpacity style={iosPickerStyles.overlayTouchable} activeOpacity={1} onPress={onCancel} />
        <View style={iosPickerStyles.sheet}>
          <View style={iosPickerStyles.headerBar}>
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={iosPickerStyles.cancelBtn}>Cancel</Text>
            </TouchableOpacity>
            <Text style={iosPickerStyles.headerTitle}>Select Date</Text>
            <TouchableOpacity onPress={() => onConfirm(tempDate)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={iosPickerStyles.doneBtn}>Done</Text>
            </TouchableOpacity>
          </View>
          <NativeDateTimePicker
            value={tempDate}
            mode="date"
            display="spinner"
            onChange={(_, date) => date && setTempDate(date)}
            maximumDate={new Date()}
            style={iosPickerStyles.picker}
            themeVariant="light"
          />
        </View>
      </View>
    </Modal>
  );
};

// ─── Android Date Picker Modal ────────────────────────────
const AndroidDatePickerModal = ({ visible, onConfirm, onCancel, currentDate }) => {
  if (!NativeDateTimePicker || !visible) return null;

  return (
    <NativeDateTimePicker
      value={currentDate || new Date()}
      mode="date"
      display="default"
      onChange={(event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
          onConfirm(selectedDate);
        } else {
          onCancel();
        }
      }}
      maximumDate={new Date()}
    />
  );
};

// ─── Filter Chips Row ─────────────────────────────────────
const FilterChipsRow = ({
  statusFilter, setStatusFilter,
  dateFilter, setDateFilter,
  customDate, setCustomDate,
  onClearAll, onOpenDatePicker,
}) => {
  const activeCount = countActiveFilters(statusFilter, dateFilter);

  return (
    <View style={chipStyles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={chipStyles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {activeCount > 0 && (
          <TouchableOpacity style={chipStyles.clearChip} onPress={onClearAll} activeOpacity={0.75}>
            <Icon name="close" size={13} color={Colors.error} />
            <Text style={chipStyles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}

        {DATE_PRESETS.filter(p => p.id !== 'all_time').map((preset) => {
          const isActive = dateFilter === preset.id;
          const isCustomActive = preset.id === 'custom' && dateFilter === 'custom';
          const active = preset.id === 'custom' ? isCustomActive : isActive;
          return (
            <TouchableOpacity
              key={preset.id}
              style={[chipStyles.chip, active && chipStyles.chipActive]}
              onPress={() => {
                if (preset.id === 'custom') {
                  onOpenDatePicker();
                } else {
                  setCustomDate(null);
                  setDateFilter(active ? 'all_time' : preset.id);
                }
              }}
              activeOpacity={0.75}
            >
              <Icon
                name={preset.id === 'custom' ? 'event' : 'schedule'}
                size={13}
                color={active ? Colors.white : Colors.textSecondary}
              />
              <Text style={[chipStyles.chipText, active && chipStyles.chipTextActive]}>
                {preset.id === 'custom' && customDate
                  ? formatDateShort(customDate)
                  : preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <View style={chipStyles.divider} />

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

      {activeCount > 0 && (
        <View style={chipStyles.summaryRow}>
          <Icon name="filter-list" size={13} color={Colors.primary} />
          <Text style={chipStyles.summaryText}>
            {dateFilter === 'today' && 'Today'}
            {dateFilter === 'yesterday' && 'Yesterday'}
            {dateFilter === 'week' && 'This Week'}
            {dateFilter === 'custom' && customDate && formatDateShort(customDate)}
            {statusFilter !== 'all_status' && dateFilter !== 'all_time' ? ' · ' : ''}
            {statusFilter === 'Delivered' && 'Delivered'}
            {statusFilter === 'Cancelled' && 'Cancelled'}
          </Text>
          <TouchableOpacity onPress={onClearAll} activeOpacity={0.7}>
            <Text style={chipStyles.summaryClear}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}
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
  const mappedStatus = getMappedStatus(order);
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

// ─── Active Orders Banner Section ─────────────────────────
const ActiveOrdersBannerSection = ({ activeOrders, navigation }) => {
  if (!activeOrders.length) return null;
  return (
    <View style={styles.activeBannerWrapper}>
      {activeOrders.map((order) => (
        <View key={order.id} style={styles.activeBannerItem}>
          <ActiveOrderBanner
            order={order}
            onPress={() =>
              navigation.navigate('OrderTrackingScreen', { orderId: order.id })
            }
          />
        </View>
      ))}
    </View>
  );
};

// ─── Order Card ───────────────────────────────────────────
const OrderCard = ({ order, onPress, onReorder, isReordering }) => {
  const scaleAnim = useRef(new Animated.Value(0.97)).current;
  React.useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }).start();
  }, []);

  const mappedStatus = getMappedStatus(order);
  const orderAge = Date.now() - new Date(order.placed_at || order.created_at).getTime();
  const showTrack = ACTIVE_STATUSES.includes(mappedStatus) && orderAge < 2 * 60 * 60 * 1000;
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
            {showTrack ? (
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
  const [customDate, setCustomDate] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [reorderingId, setReorderingId] = useState(null);
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  // ── FIX: Ref to avoid stale closures in cancel handlers ──
  const customDateRef = useRef(null);
  useEffect(() => {
    customDateRef.current = customDate;
  }, [customDate]);

  const { data: queryOrders, refetch, isRefetching, isLoading } = useQuery({
    queryKey: ['orders'],
    enabled: false,
  });

  const storeOrders = useOrderStore(state => state.orders);

  const orders = useMemo(() => {
    if (!Array.isArray(queryOrders) || queryOrders.length === 0) return storeOrders;

    const storeByStrId = new Map(storeOrders.map(o => [String(o.id), o]));
    const merged = queryOrders.map(qo => {
      const so = storeByStrId.get(String(qo.id));
      if (!so) return qo;
      return {
        ...qo,
        restaurantName: so?.restaurantName || qo.restaurantName || qo.restaurant_name,
        deliveryAddress: so?.deliveryAddress || null,
        platform_fee: so?.platform_fee ?? 5,
        items: qo.items?.length ? qo.items : so?.items,
      };
    });

    const queryStrIds = new Set(queryOrders.map(o => String(o.id)));
    const extras = storeOrders.filter(o => !queryStrIds.has(String(o.id)));
    return extras.length > 0 ? [...extras, ...merged] : merged;
  }, [queryOrders, storeOrders]);

  const activeOrders = useMemo(
    () => orders.filter(isLiveActive),
    [orders],
  );

  const activeOrderIdSet = useMemo(
    () => new Set(activeOrders.map(o => o.id)),
    [activeOrders],
  );

  // ── Date picker handlers ──────────────────────────────
  const openDatePicker = useCallback(() => {
    setDatePickerOpen(true);
  }, []);

  const onAndroidDateChange = useCallback((event, selectedDate) => {
    setDatePickerOpen(false);
    if (event.type === 'set' && selectedDate) {
      setCustomDate(selectedDate);
      setDateFilter('custom');
    } else if (event.type === 'dismissed') {
      if (!customDateRef.current) {
        setDateFilter('all_time');
      }
    }
  }, []);

  const onIOSConfirm = useCallback((date) => {
    setCustomDate(date);
    setDateFilter('custom');
    setDatePickerOpen(false);
  }, []);

  const onIOSCancel = useCallback(() => {
    setDatePickerOpen(false);
    if (!customDateRef.current) {
      setDateFilter('all_time');
    }
  }, []);

  // Calendar picker confirm (pure JS — no native dep)
  const onCalendarConfirm = useCallback((date) => {
    setCustomDate(date);
    setDateFilter('custom');
    setDatePickerOpen(false);
  }, []);

  // Calendar picker cancel
  const onCalendarCancel = useCallback(() => {
    setDatePickerOpen(false);
    if (!customDateRef.current) {
      setDateFilter('all_time');
    }
  }, []);

  // ── Filtered + sorted orders ──────────────────────────
  const filteredOrders = useMemo(() => {
    const datePreset = DATE_PRESETS.find(p => p.id === dateFilter);
    return orders
      .filter(o => {
        const s = getMappedStatus(o);

        if (activeTab === 'active') {
          return activeOrderIdSet.has(o.id);
        }

        if (activeOrderIdSet.has(o.id)) return false;

        if (statusFilter !== 'all_status' && s !== statusFilter) return false;

        if (!isWithinDays(o.placed_at || o.created_at, datePreset?.days ?? null, customDate)) return false;

        return true;
      })
      .sort((a, b) =>
        new Date(b.placed_at || b.created_at) - new Date(a.placed_at || a.created_at)
      );
  }, [orders, activeTab, statusFilter, dateFilter, customDate, activeOrderIdSet]);

  const activeFilterCount = countActiveFilters(statusFilter, dateFilter);

  const clearAllFilters = useCallback(() => {
    setStatusFilter('all_status');
    setDateFilter('all_time');
    setCustomDate(null);
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
            name: item.name ?? item.item_name ?? item.item_name_snapshot ?? '',
            base_price: item.unit_price ?? item.unit_price_snapshot ?? item.base_price ?? item.price ?? 0,
            price: item.unit_price ?? item.unit_price_snapshot ?? item.base_price ?? item.price ?? 0,
            image_url: item.image ?? item.image_url ?? null,
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

  const screenWidth = Dimensions.get('window').width;
  const tabPadding = 16;
  const trackPadding = 4;
  const tabWidth = (screenWidth - tabPadding * 2 - trackPadding * 2) / TABS.length;
  const indicatorWidth = tabWidth - 8;
  const indicatorLeft = tabIndicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, tabWidth + 4],
  });

  const ListHeader = useCallback(() => (
    <View>
      {activeOrders.length > 0 && (
        <ActiveOrdersBannerSection
          activeOrders={activeOrders}
          navigation={navigation}
        />
      )}
      {filteredOrders.length > 0 && (
        <View style={styles.listLabelRow}>
          <Text style={styles.listLabel}>
            {activeTab === 'all' && `All Orders (${filteredOrders.length})`}
            {activeTab === 'active' && `Active Orders (${filteredOrders.length})`}
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
  ), [activeOrders, filteredOrders.length, activeTab, activeFilterCount, navigation]);

  // ── Render date picker ────────────────────────────────
  const renderDatePicker = () => {
    if (HAS_NATIVE_PICKER) {
      if (Platform.OS === 'ios') {
        return (
          <NativeIOSPickerModal
            visible={datePickerOpen}
            onConfirm={onIOSConfirm}
            onCancel={onIOSCancel}
            currentDate={customDate || new Date()}
          />
        );
      }
      return (
        <AndroidDatePickerModal
          visible={datePickerOpen}
          onConfirm={(date) => {
            setCustomDate(date);
            setDateFilter('custom');
            setDatePickerOpen(false);
          }}
          onCancel={() => {
            setDatePickerOpen(false);
            if (!customDateRef.current) setDateFilter('all_time');
          }}
          currentDate={customDate || new Date()}
        />
      );
    }

    // Fallback: pure JS calendar picker — no native dependency
    return (
      <CalendarDatePickerModal
        visible={datePickerOpen}
        onConfirm={onCalendarConfirm}
        onCancel={onCalendarCancel}
        currentDate={customDate}
      />
    );
  };

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
          <Animated.View style={[styles.tabIndicator, { left: indicatorLeft, width: indicatorWidth }]} />
          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, { flex: 1 }]}
              onPress={() => switchTab(tab.id, index)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
                {tab.id === 'active' && activeOrders.length > 0
                  ? ` (${activeOrders.length})`
                  : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Filter chips — only on 'all' tab */}
      {activeTab === 'all' && (
        <FilterChipsRow
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          customDate={customDate}
          setCustomDate={setCustomDate}
          onClearAll={clearAllFilters}
          onOpenDatePicker={openDatePicker}
        />
      )}

      {/* Date Picker */}
      {renderDatePicker()}

      {/* List */}
      {isLoading && !storeOrders.length ? (
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
                const s = getMappedStatus(item);
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
            activeTab === 'all' && activeFilterCount > 0 ? (
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

// ─── Calendar Date Picker Styles ──────────────────────────
const calStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    flex: 1,
    width: '100%',
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  container: {
    width: '92%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },

  // Quick picks
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  quickChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  quickChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  quickChipTextActive: {
    color: Colors.white,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
  },

  // Month navigation
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  monthArrow: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  monthArrowDisabled: {
    opacity: 0.4,
  },
  monthLabelWrap: {
    flex: 1,
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },

  // Weekday headers
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  weekText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  weekTextWeekend: {
    color: '#D1D5DB',
  },

  // Calendar body
  calendarBody: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  weekDayRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellToday: {
    backgroundColor: Colors.primaryLight,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  dayTextToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  dayTextFuture: {
    color: '#E5E7EB',
  },
  todayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  selectedRing: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  selectedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  selectedPreviewText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  applyBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});

// ─── iOS Native Picker styles ─────────────────────────────
const iosPickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlayTouchable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelBtn: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  doneBtn: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  picker: { height: 200, width: '100%' },
});

// ─── Chip styles ──────────────────────────────────────────
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    flex: 1,
  },
  summaryClear: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.error ?? '#E53935',
  },
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

  activeBannerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  activeBannerItem: {},
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