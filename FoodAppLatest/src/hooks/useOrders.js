import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { getOrders } from '../services/order/orderService';
import { socket } from '../services/socket/socket';
import { useOrderStore, STATUS_MAP } from '../store/orderStore';

const FULL_STATUS_MAP = {
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

const ACTIVE_STATUSES = [
  'Placed', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery',
];

// Resolves an order's display status from either the mapped field or raw field
const resolveDisplayStatus = (order) =>
  order.status || FULL_STATUS_MAP[order.order_status] || order.order_status || '';

export const useOrders = () => {
  const queryClient = useQueryClient();

  // Track which order rooms we've joined so we can leave them on cleanup
  const joinedRoomsRef = useRef(new Set());

  // ── Fetch from API ──────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await getOrders();
      const rawOrders = Array.isArray(res?.data) ? res.data : [];
      const storeOrders = useOrderStore.getState().orders;

      return rawOrders.map(o => {
        const local = storeOrders.find(s => s.id === o.id);
        const normalizedStatus = FULL_STATUS_MAP[o.order_status] ?? o.order_status;
        const items = (local?.items ?? o.items ?? []).map(item => ({
          ...item,
          name: item.name || item.item_name || item.item_name_snapshot || '',
          item_name: item.item_name || item.name || item.item_name_snapshot || '',
        }));

        return {
          ...o,
          order_status: normalizedStatus,
          restaurantName: local?.restaurantName || o.restaurant_name || 'Restaurant',
          deliveryAddress: local?.deliveryAddress || null,
          items,
        };
      });
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  // ── Join SignalR rooms for all active orders ────────────────────────────
  //
  // FIX: The original implementation only joined rooms from query.data, which
  // means rooms were never joined during the initial loading phase (query.data
  // is undefined). If a status update arrived before the query resolved, the
  // socket event was silently dropped because the client was not in any room.
  //
  // Fix: Derive the active order ID list from BOTH sources:
  //   1. query.data  — authoritative after first fetch
  //   2. orderStore  — available immediately (persisted to AsyncStorage)
  //
  // Whichever resolves first wins, ensuring we are always subscribed to the
  // correct rooms from the moment the hook mounts, not from when the API responds.
  const syncRooms = (activeIds) => {
    activeIds.forEach(id => {
      if (!joinedRoomsRef.current.has(id)) {
        socket.emit('joinOrderRoom', id);
        joinedRoomsRef.current.add(id);
      }
    });

    joinedRoomsRef.current.forEach(id => {
      if (!activeIds.includes(id)) {
        socket.emit('leaveOrderRoom', id);
        joinedRoomsRef.current.delete(id);
      }
    });
  };

  // Effect 1: Join rooms from React Query data (authoritative after fetch)
  useEffect(() => {
    const activeIds = (query.data ?? [])
      .filter(o => ACTIVE_STATUSES.includes(resolveDisplayStatus(o)))
      .map(o => o.id);
    syncRooms(activeIds);
  }, [query.data]);

  // Effect 2: Join rooms immediately from persisted store while query is loading.
  // This runs once on mount. After the query resolves, Effect 1 takes over and
  // will leave any rooms that are no longer active.
  useEffect(() => {
    if (query.data != null) return; // query already resolved — Effect 1 handles it

    const storeOrders = useOrderStore.getState().orders;
    const activeIds = storeOrders
      .filter(o => ACTIVE_STATUSES.includes(resolveDisplayStatus(o)))
      .map(o => o.id);
    syncRooms(activeIds);
  }, []); // intentionally runs only once on mount

  // Leave all rooms on unmount
  useEffect(() => {
    return () => {
      joinedRoomsRef.current.forEach(id => socket.emit('leaveOrderRoom', id));
      joinedRoomsRef.current.clear();
    };
  }, []);

  // ── Real-time: status update ────────────────────────────────────────────
  useEffect(() => {
    const handleStatusUpdate = (data) => {
      const mappedStatus = FULL_STATUS_MAP[data.status] ?? data.status;

      // Update React Query cache
      queryClient.setQueryData(['orders'], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map(o =>
          o.id === data.orderId
            ? { ...o, order_status: mappedStatus, status: mappedStatus }
            : o
        );
      });

      // Update Zustand store — OrdersScreen subscribes to this
      useOrderStore.getState().setOrderStatus(data.orderId, data.status);
    };

    socket.on('OrderStatusUpdated', handleStatusUpdate);
    return () => socket.off('OrderStatusUpdated', handleStatusUpdate);
  }, [queryClient]);

  // ── New order placed: invalidate so list refreshes immediately ──────────
  useEffect(() => {
    const unsub = useOrderStore.subscribe(
      (state) => state.orders,
      (orders, prevOrders) => {
        if (orders.length > prevOrders.length) {
          const newOrder = orders.find(o => !prevOrders.some(p => p.id === o.id));
          if (newOrder) {
            queryClient.setQueryData(['orders'], (old) => {
              const existing = Array.isArray(old) ? old : [];
              if (existing.some(o => o.id === newOrder.id)) return existing;
              return [newOrder, ...existing];
            });

            // Join the room for the new order immediately so live updates
            // work from the moment the order is placed
            if (!joinedRoomsRef.current.has(newOrder.id)) {
              socket.emit('joinOrderRoom', newOrder.id);
              joinedRoomsRef.current.add(newOrder.id);
            }
          }
          queryClient.refetchQueries({ queryKey: ['orders'] });
        }
      }
    );
    return () => unsub();
  }, [queryClient]);

  return query;
};