import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getOrderById as getOrderByIdAPI,
  placeOrder as placeOrderAPI,
} from "../services/order/orderService";

// ✅ Display labels used in UI — values must match STATUS_CONFIG keys in OrderTrackingScreen
export const ORDER_STATUSES = [
  'Placed',
  'Confirmed',
  'Preparing',
  'Ready for Pickup',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];


export const STATUS_MAP = {
  // snake_case (from socket events)
  placed: 'Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  // PascalCase (from GET /orders API response)
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

export const useOrderStore = create(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,
      isPlacing: false,

      // ─── Fetch single order from backend ──────────────────────────────────
      fetchOrderById: async (id) => {
        try {
          // orderService.getOrderById returns res.data = { success, data: OrderDto }
          const res = await getOrderByIdAPI(id);
          const order = res?.data; // ← OrderDto
          if (!order) return;

          // Fetch restaurant name if not already known
          let restaurantName = order.restaurant_name || 'Restaurant';
          try {
            const { getRestaurantById } = await import(
              "../services/restaurant/restaurantService"
            );
            const rest = await getRestaurantById(order.restaurant_id);
            restaurantName = rest?.data?.name || restaurantName;
          } catch (_) { }

          // Preserve fields that only exist on the POST response or locally enriched order
          const existing = get().orders.find(o => o.id === order.id);

          const enrichedOrder = {
            ...order,

            // Prefer locally stored restaurant name (set at order placement time)
            restaurantName: existing?.restaurantName || restaurantName,

            // Preserve full address object stored at placement time
            // GET /orders/:id only returns delivery_address_id (Guid), not full address
            deliveryAddress: existing?.deliveryAddress || null,

            // platform_fee is not a DB column — not returned by GET endpoint
            platform_fee: existing?.platform_fee ?? 5,

            // ✅ OrderDto.TotalAmount → total_amount
            total: parseFloat(order.total_amount || 0),

            // ✅ OrderDto.OrderStatus → order_status (snake_case_lower)
            //    e.g. 'placed', 'confirmed', 'out_for_delivery'
            status: STATUS_MAP[order.order_status] ?? order.order_status,
          };

          set(state => ({
            orders: [
              enrichedOrder,
              ...state.orders.filter(o => o.id !== order.id),
            ],
            currentOrder: enrichedOrder,
          }));
        } catch (error) {
          console.log('fetchOrderById error:', error);
        }
      },

      // ─── Place a new order ─────────────────────────────────────────────────
      placeOrder: async (cartData, address, payment) => {
        set({ isPlacing: true });

        try {
          // ✅ CreateOrderRequestDto fields (snake_case_lower serializer):
          //   RestaurantId      → restaurant_id
          //   OrderType         → order_type     enum: 'Delivery'|'Takeaway'|'DineIn'
          //   DeliveryAddressId → delivery_address_id
          //   PaymentMethod     → payment_method  enum: 'Online'|'COD'
          //   Items             → items
          //   CouponCode        → coupon_code
          //   Notes             → notes
          //   TableId           → table_id
          //
          // ❌ delivery_fee is NOT in CreateOrderRequestDto — backend calculates it
          const payload = {
            restaurant_id: cartData.restaurantId,
            order_type: 'Delivery',               // PascalCase enum value
            delivery_address_id: address.id,
            payment_method: payment === 'cod'
              ? 'COD'                // ← was 'cod' ❌
              : 'Online',            // ← was 'online' ❌
            items: cartData.items.map(i => ({
              menu_item_id: i.id,
              quantity: i.quantity,
              // notes: i.notes || null,  // add if you support per-item notes
            })),
            coupon_code: cartData.couponCode || null,
            notes: null,
            table_id: null,            // only for DineIn orders
          };

          // placeOrderAPI returns res.data = { success, data: OrderDto, message }
          const res = await placeOrderAPI(payload);
          const newOrderRaw = res?.data; // ← OrderDto
          if (!newOrderRaw) throw new Error('No order data returned from server');

          // Fetch restaurant name for tracking screen
          let restaurantName = cartData.restaurantName || 'Restaurant';
          try {
            const { getRestaurantById } = await import(
              "../services/restaurant/restaurantService"
            );
            const rest = await getRestaurantById(cartData.restaurantId);
            restaurantName = rest?.data?.name || restaurantName;
          } catch (_) { }

          const enrichedOrder = {
            ...newOrderRaw,
            restaurantName,

            // Store full address object — GET /orders/:id won't return it
            deliveryAddress: address,

            total: parseFloat(newOrderRaw.total_amount || 0),
            status: STATUS_MAP[newOrderRaw.order_status] ?? newOrderRaw.order_status,
          };

          set(state => ({
            orders: [enrichedOrder, ...state.orders],
            currentOrder: enrichedOrder,
            isPlacing: false,
          }));

          return enrichedOrder;

        } catch (e) {
          set({ isPlacing: false });
          throw e;
        }
      },

      // ─── Update order status (called by socket events) ─────────────────────
      // status arrives as raw .NET enum string e.g. 'confirmed', 'out_for_delivery'
      setOrderStatus: (orderId, status) =>
        set(state => {
          const mappedStatus = STATUS_MAP[status] ?? status;

          const updatedOrders = state.orders.map(order =>
            order.id === orderId
              ? { ...order, order_status: status, status: mappedStatus }
              : order
          );

          const updatedCurrent =
            state.currentOrder?.id === orderId
              ? { ...state.currentOrder, order_status: status, status: mappedStatus }
              : state.currentOrder;

          return { orders: updatedOrders, currentOrder: updatedCurrent };
        }),

      // ─── Local cancel (after API call succeeds) ────────────────────────────
      cancelOrder: orderId =>
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? { ...o, order_status: 'cancelled', status: 'Cancelled' }
              : o
          ),
          currentOrder:
            state.currentOrder?.id === orderId
              ? null
              : state.currentOrder,
        })),

      clearCurrentOrder: () => set({ currentOrder: null }),
      clearOrders: () => set({ orders: [] }),

      // ─── Helpers ───────────────────────────────────────────────────────────

      getCurrentStatusIndex: () => {
        const { currentOrder } = get();
        if (!currentOrder) return 0;
        const status = currentOrder.status ?? 'Placed';
        if (status === 'Cancelled') return 0;
        const idx = ORDER_STATUSES.indexOf(status);
        return idx === -1 ? 0 : idx;
      },

      getOrderById: id =>
        get().orders.find(o => o.id === id) ?? null,

      getActiveOrders: () =>
        get().orders.filter(o =>
          ['Placed', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery']
            .includes(o.status)
        ),

      getPastOrders: () =>
        get().orders.filter(o =>
          ['Delivered', 'Cancelled', 'Refunded'].includes(o.status)
        ),
    }),
    {
      name: 'foodapp-orders',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);