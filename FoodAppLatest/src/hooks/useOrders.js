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

const resolveDisplayStatus = (order) =>
  order.status || FULL_STATUS_MAP[order.order_status] || order.order_status || '';

export const useOrders = () => {
  const queryClient = useQueryClient();

  const joinedRoomsRef = useRef(new Map());

  // ── Fetch from API ──────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const store = useOrderStore.getState();
      const storeOrders = store.orders;
      const needsFullSync = storeOrders.length === 0 || !store.lastFullSync;

      // ── Normalize one raw API order ──────────────────────────────────────
      // API items always take priority over store items.
      // Store items are only used as fallback when API returned none.
      // Real-time status from store is preserved if it exists.
      const normalize = (o) => {
        const local = storeOrders.find(s => String(s.id) === String(o.id));
        const normalizedStatus = FULL_STATUS_MAP[o.order_status] ?? o.order_status;

        const apiItems = o.items ?? [];
        const storeItems = local?.items ?? [];
        const rawItems = apiItems.length > 0 ? apiItems : storeItems;

        const items = rawItems.map(item => ({
          ...item,
          name: item.name || item.item_name || item.item_name_snapshot || '',
          item_name: item.item_name || item.name || item.item_name_snapshot || '',
        }));

        return {
          ...o,
          order_status: normalizedStatus,
          restaurantName: local?.restaurantName || o.restaurant_name || 'Restaurant',
          deliveryAddress: local?.deliveryAddress || null,
          // Preserve real-time status update from store if present
          ...(local?.status ? { status: local.status } : {}),
          items,
        };
      };

      // ── Fetch one page from API ──────────────────────────────────────────
      const fetchPage = async (page) => {
        const res = await getOrders({ page, page_size: 20 });
        const raw = res?.data;
        if (Array.isArray(raw)) return { orders: raw, isLast: raw.length < 20 };
        if (Array.isArray(raw?.items)) return { orders: raw.items, isLast: !raw.hasNextPage };
        return { orders: [], isLast: true };
      };

      let rawOrders = [];

      if (needsFullSync) {
        // Fresh login — paginate through ALL pages until we hit orders
        // already in the store (meaning we have caught up) or reach the end.
        const storeIds = new Set(storeOrders.map(o => String(o.id)));
        let page = 1;
        while (true) {
          const { orders: pageOrders, isLast } = await fetchPage(page);
          if (pageOrders.length === 0) break;
          rawOrders.push(...pageOrders);
          page++;
          const hitExisting = pageOrders.some(o => storeIds.has(String(o.id)));
          if (hitExisting || isLast) break;
        }
        store.setLastFullSync(Date.now());
      } else {
        // Subsequent refreshes — only fetch page 1 (latest 20 orders)
        const { orders: pageOrders } = await fetchPage(1);
        rawOrders = pageOrders;
      }

      // Normalize all API orders (API items win over stale store items)
      const mapped = rawOrders.map(normalize);

      // Merge into store — only inserts orders not already present,
      // preserving real-time status updates on existing entries.
      store.bulkMergeOrders(mapped);

      const mappedStrIds = new Set(rawOrders.map(o => String(o.id)));

      // For incremental refresh: older orders not in this API response
      // come from the store (they were fetched during full sync).
      const updatedStoreOrders = useOrderStore.getState().orders;
      const olderStoreOrders = updatedStoreOrders.filter(
        o => !mappedStrIds.has(String(o.id))
      );

      // mapped first (fresh API data with correct items),
      // then older store orders (already correct from full sync).
      const allOrders = [...mapped, ...olderStoreOrders];

      // Prepend freshly-placed active orders not yet returned by API
      // (e.g. order placed < 1s ago, API hasn't persisted it yet).
      const extras = storeOrders.filter(o =>
        !mappedStrIds.has(String(o.id)) &&
        ACTIVE_STATUSES.includes(resolveDisplayStatus(o)) &&
        !olderStoreOrders.some(s => String(s.id) === String(o.id))
      );

      return extras.length > 0 ? [...extras, ...allOrders] : allOrders;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  // ── SignalR room management ───────────────────────────────────────────────
  const syncRooms = async (activeIds) => {
    const activeStr = new Set(activeIds.map(id => String(id)));

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

    for (const [strId, originalId] of joinedRoomsRef.current) {
      if (!activeStr.has(strId)) {
        try {
          await socket.emit('leaveOrderRoom', originalId);
        } catch (_) { }
        joinedRoomsRef.current.delete(strId);
      }
    }
  };

  // Effect 1: Join rooms from React Query data + store orders.
  useEffect(() => {
    const queryIds = (query.data ?? [])
      .filter(o => ACTIVE_STATUSES.includes(resolveDisplayStatus(o)))
      .map(o => o.id);
    const storeIds = useOrderStore.getState().orders
      .filter(o => ACTIVE_STATUSES.includes(resolveDisplayStatus(o)))
      .map(o => o.id);
    const seen = new Set();
    const combined = [...queryIds, ...storeIds].filter(id => {
      const s = String(id);
      return seen.has(s) ? false : (seen.add(s), true);
    });
    syncRooms(combined);
  }, [query.data]);

  // Effect 2: Join rooms immediately from persisted store while query is loading.
  useEffect(() => {
    if (query.data != null) return;
    const storeOrders = useOrderStore.getState().orders;
    const activeIds = storeOrders
      .filter(o => ACTIVE_STATUSES.includes(resolveDisplayStatus(o)))
      .map(o => o.id);
    syncRooms(activeIds);
  }, []);

  // Effect 3: Re-join all rooms after a SignalR reconnect.
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
        socket.emit('leaveOrderRoom', originalId).catch(() => { });
      }
      joinedRoomsRef.current.clear();
    };
  }, []);

  // ── Real-time: status update ──────────────────────────────────────────────
  useEffect(() => {
    const handleStatusUpdate = (data) => {
      const mappedStatus = FULL_STATUS_MAP[data.status] ?? data.status;
      const sigId = String(data.orderId);

      queryClient.setQueryData(['orders'], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map(o =>
          String(o.id) === sigId
            ? { ...o, order_status: mappedStatus, status: mappedStatus }
            : o
        );
      });

      useOrderStore.getState().setOrderStatus(data.orderId, data.status);
    };

    socket.on('OrderStatusUpdated', handleStatusUpdate);
    return () => socket.off('OrderStatusUpdated', handleStatusUpdate);
  }, [queryClient]);

  // ── New order placed: sync into React Query cache + refetch ──────────────
  useEffect(() => {
    const unsub = useOrderStore.subscribe(async (state, prevState) => {
      const orders = state.orders;
      const prevOrders = prevState.orders;
      if (orders.length > prevOrders.length) {
        const newOrder = orders.find(
          o => !prevOrders.some(p => String(p.id) === String(o.id))
        );
        if (newOrder) {
          queryClient.setQueryData(['orders'], (old) => {
            const existing = Array.isArray(old) ? old : [];
            const newStrId = String(newOrder.id);
            if (existing.some(o => String(o.id) === newStrId)) return existing;
            return [newOrder, ...existing];
          });

          const newOrderStrId = String(newOrder.id);
          if (!joinedRoomsRef.current.has(newOrderStrId)) {
            try {
              await socket.emit('joinOrderRoom', newOrder.id);
              joinedRoomsRef.current.set(newOrderStrId, newOrder.id);
            } catch (_) { }
          }
        }
        queryClient.refetchQueries({ queryKey: ['orders'] });
      }
    });
    return () => unsub();
  }, [queryClient]);

  return query;
};