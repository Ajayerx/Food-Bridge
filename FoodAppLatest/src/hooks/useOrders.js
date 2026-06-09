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

  // Track which order rooms we've joined so we can leave them on cleanup.
  // Map<stringId, originalId> — stores original ID type so socket.emit
  // receives the exact type the SignalR hub expects (int vs string).
  const joinedRoomsRef = useRef(new Map());

  // ── Fetch from API ──────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await getOrders();
      const rawOrders = Array.isArray(res?.data) ? res.data : [];
      const storeOrders = useOrderStore.getState().orders;

      const mapped = rawOrders.map(o => {
        const local = storeOrders.find(s => String(s.id) === String(o.id));
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

      // Append active store orders that the API doesn't know about yet (e.g.
      // a freshly placed order). Without this, queryClient.refetchQueries in
      // the subscription below would silently drop the new order from the
      // React Query cache, breaking both the UI and future SignalR updates.
      const rawStrIds = new Set(rawOrders.map(o => String(o.id)));
      const extras = storeOrders.filter(o =>
        !rawStrIds.has(String(o.id)) && ACTIVE_STATUSES.includes(resolveDisplayStatus(o))
      );
      return extras.length > 0 ? [...extras, ...mapped] : mapped;
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
  //
  // Note: All IDs are coerced to strings because the REST API and SignalR hub
  // may use different wire types (number vs string) for the same logical ID.
  const syncRooms = async (activeIds) => {
    const activeStr = new Set(activeIds.map(id => String(id)));

    // Join new rooms — emit with the ORIGINAL type (the SignalR hub may
    // reject a string when it expects int, causing a silent failure).
    // Only add to joinedRoomsRef AFTER the emit succeeds, so a failure
    // (race condition, wrong type, dropped connection) doesn't leave
    // the room permanently un-joined.
    for (const originalId of activeIds) {
      const strId = String(originalId);
      if (!joinedRoomsRef.current.has(strId)) {
        try {
          await socket.emit('joinOrderRoom', originalId);
          joinedRoomsRef.current.set(strId, originalId);
        } catch (_) {
          // emit failed — don't add to ref so we retry on the next sync
        }
      }
    }

    // Leave stale rooms — use the stored original ID for the leave event.
    for (const [strId, originalId] of joinedRoomsRef.current) {
      if (!activeStr.has(strId)) {
        try {
          await socket.emit('leaveOrderRoom', originalId);
        } catch (_) {}
        joinedRoomsRef.current.delete(strId);
      }
    }
  };

  // Effect 1: Join rooms from React Query data + store orders.
  //
  // query.data alone is insufficient: if a new order was just placed by the
  // Zustand subscription but the refetch hasn't resolved yet (or the API hasn't
  // persisted it), query.data doesn't include the new order and syncRooms
  // never tries to join its room. By also reading store orders, we cover any
  // gaps and ensure the room is always joined on the next effect run.
  useEffect(() => {
    const queryIds = (query.data ?? [])
      .filter(o => ACTIVE_STATUSES.includes(resolveDisplayStatus(o)))
      .map(o => o.id);
    const storeIds = useOrderStore.getState().orders
      .filter(o => ACTIVE_STATUSES.includes(resolveDisplayStatus(o)))
      .map(o => o.id);
    // Deduplicate by string ID
    const seen = new Set();
    const combined = [...queryIds, ...storeIds].filter(id => {
      const s = String(id);
      return seen.has(s) ? false : (seen.add(s), true);
    });
    syncRooms(combined);
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

  // Effect 3: Re-join all rooms after a SignalR reconnect.
  // The server drops all groups on disconnect; without this the client would
  // never re-subscribe and would miss all subsequent events.
  useEffect(() => {
    socket.onReconnected(() => {
      joinedRoomsRef.current.clear();
      const storeOrders = useOrderStore.getState().orders;
      const activeIds = storeOrders
        .filter(o => ACTIVE_STATUSES.includes(resolveDisplayStatus(o)))
        .map(o => o.id);
      syncRooms(activeIds);
    });
    return () => socket.onReconnected(null);
  }, []);

  // Leave all rooms on unmount
  useEffect(() => {
    return () => {
      for (const originalId of joinedRoomsRef.current.values()) {
        socket.emit('leaveOrderRoom', originalId).catch(() => {});
      }
      joinedRoomsRef.current.clear();
    };
  }, []);

  // ── Real-time: status update ────────────────────────────────────────────
  useEffect(() => {
    const handleStatusUpdate = (data) => {
      const mappedStatus = FULL_STATUS_MAP[data.status] ?? data.status;
      const sigId = String(data.orderId); // coerce to string once

      // Update React Query cache
      queryClient.setQueryData(['orders'], (old) => {
        if (!Array.isArray(old)) return old;
        // The backend may return numeric IDs from REST but string IDs from
        // SignalR (or vice versa). Coerce both sides to string for a reliable
        // match so the status update is never silently dropped.
        return old.map(o =>
          String(o.id) === sigId
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

  // ── New order placed: sync into React Query cache + refetch ────────────
  //
  // ⚠️ Do NOT use the two-argument subscribe(selector, listener) form here —
  //    the store is NOT wrapped with subscribeWithSelector middleware, so
  //    the second argument would be silently ignored (dead code).
  //    Instead, destructure state / prevState from the vanilla listener.
  useEffect(() => {
    const unsub = useOrderStore.subscribe(async (state, prevState) => {
      const orders = state.orders;
      const prevOrders = prevState.orders;
      if (orders.length > prevOrders.length) {
        const newOrder = orders.find(o => !prevOrders.some(p => String(p.id) === String(o.id)));
        if (newOrder) {
          queryClient.setQueryData(['orders'], (old) => {
            const existing = Array.isArray(old) ? old : [];
            const newStrId = String(newOrder.id);
            if (existing.some(o => String(o.id) === newStrId)) return existing;
            return [newOrder, ...existing];
          });

          // Join the room for the new order immediately so live updates
          // work from the moment the order is placed.
          // Only add to joinedRoomsRef after emit succeeds so a failure
          // doesn't leave the room permanently un-joined.
          const newOrderStrId = String(newOrder.id);
          if (!joinedRoomsRef.current.has(newOrderStrId)) {
            try {
              await socket.emit('joinOrderRoom', newOrder.id);
              joinedRoomsRef.current.set(newOrderStrId, newOrder.id);
            } catch (_) {}
          }
        }
        queryClient.refetchQueries({ queryKey: ['orders'] });
      }
    });
    return () => unsub();
  }, [queryClient]);

  return query;
};