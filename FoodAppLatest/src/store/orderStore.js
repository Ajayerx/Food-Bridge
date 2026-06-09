import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getOrderById as getOrderByIdAPI,
  placeOrder as placeOrderAPI,
} from "../services/order/orderService";
import { getRestaurantById } from "../services/restaurant/restaurantService";

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
          const res = await getOrderByIdAPI(id);
          const order = res?.data;
          if (!order) return;

          // ✅ FIX: declare existing BEFORE it's used below
          const existing = get().orders.find(o => String(o.id) === String(order.id));

          // ✅ FIX: use what the API already returns — no blocking getRestaurantById call
          // If restaurant_name comes from the API, use it. Otherwise fall back to
          // the locally stored name. Background-fetch only when truly missing.
          const restaurantName =
            existing?.restaurantName ||
            order.restaurant_name ||
            'Restaurant';

          // Background-fetch restaurant name only if the API didn't return one.
          // Does NOT block the function — enrichedOrder is built and stored first.
          if (!order.restaurant_name) {
            getRestaurantById(order.restaurant_id)
              .then(rest => {
                const realName = rest?.data?.name;
                if (!realName) return;
                set(state => ({
                  orders: state.orders.map(o =>
                    String(o.id) === String(order.id)
                      ? { ...o, restaurantName: realName }
                      : o
                  ),
                }));
              })
              .catch(() => { });
          }

          const enrichedOrder = {
            ...order,
            // Prefer locally stored restaurant name (set at order placement time)
            restaurantName,
            // Preserve full address object stored at placement time
            // GET /orders/:id only returns delivery_address_id (Guid), not full address
            deliveryAddress: existing?.deliveryAddress || null,
            // platform_fee is not a DB column — not returned by GET endpoint
            platform_fee: existing?.platform_fee ?? 5,
            // ✅ OrderDto.TotalAmount → total_amount
            total: parseFloat(order.total_amount || 0),
            // ✅ OrderDto.OrderStatus → order_status (snake_case_lower)
            status: STATUS_MAP[order.order_status] ?? order.order_status,
          };

          set(state => ({
            orders: [
              enrichedOrder,
              ...state.orders.filter(o => String(o.id) !== String(order.id)),
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
          // ✅ CreateOrderRequestDto fields (snake_case_lower serializer)
          const payload = {
            restaurant_id: cartData.restaurantId,
            order_type: 'Delivery',
            delivery_address_id: address.id,
            payment_method: payment === 'cod' ? 'COD' : 'Online',
            items: cartData.items.map(i => ({
              menu_item_id: i.id,
              quantity: i.quantity,
            })),
            coupon_code: cartData.couponCode || null,
            notes: null,
            table_id: null,
          };

          const res = await placeOrderAPI(payload);
          const newOrderRaw = res?.data;
          if (!newOrderRaw) throw new Error('No order data returned from server');

          // ✅ FIX: use restaurantName from cart immediately — don't await API call.
          // getRestaurantById was blocking navigation by 200–500ms unnecessarily.
          // cartData.restaurantName is always set when the user adds the first item.
          const restaurantName = cartData.restaurantName || 'Restaurant';

          // ✅ POST /orders may return items:[] — fall back to cart items so the
          // order store always has item data for OrdersScreen and reorder.
          // All price fields are normalised so reorder works regardless of
          // which field name (unit_price vs price) the data came from.
          const orderItems = (
            newOrderRaw.items?.length ? newOrderRaw.items : cartData.items ?? []
          ).map(i => ({
            ...i,
            menu_item_id: i.menu_item_id ?? i.id,
            item_name: i.item_name ?? i.name ?? i.item_name_snapshot ?? '',
            item_name_snapshot: i.item_name_snapshot ?? i.name ?? i.item_name ?? '',
            name: i.name ?? i.item_name ?? i.item_name_snapshot ?? '',
            quantity: i.quantity ?? 1,
            unit_price: i.unit_price ?? i.unit_price_snapshot ?? i.price ?? i.base_price ?? 0,
            unit_price_snapshot: i.unit_price_snapshot ?? i.unit_price ?? i.price ?? i.base_price ?? 0,
            // ✅ keep `price` field so reorder in OrdersScreen can always find it
            price: i.unit_price ?? i.unit_price_snapshot ?? i.price ?? i.base_price ?? 0,
            image: i.image ?? i.image_url ?? null,
          }));

          const enrichedOrder = {
            ...newOrderRaw,
            restaurantName,
            // Store full address object — GET /orders/:id won't return it
            deliveryAddress: address,
            items: orderItems,
            total: parseFloat(newOrderRaw.total_amount || 0),
            status: STATUS_MAP[newOrderRaw.order_status] ?? newOrderRaw.order_status,
          };

          // ✅ FIX: set store + isPlacing:false BEFORE the background fetch starts
          // so CheckoutScreen gets the return value immediately and can navigate
          // without waiting for any extra network call.
          set(state => ({
            orders: [enrichedOrder, ...state.orders],
            currentOrder: enrichedOrder,
            isPlacing: false,
          }));

          // ✅ Background-fetch real restaurant name AFTER returning.
          // If it succeeds, silently updates both orders list and currentOrder.
          // If it fails, cart name is perfectly fine — no crash, no visible change.
          getRestaurantById(cartData.restaurantId)
            .then(rest => {
              const realName = rest?.data?.name;
              if (!realName) return;
              set(state => ({
                orders: state.orders.map(o =>
                  String(o.id) === String(enrichedOrder.id)
                    ? { ...o, restaurantName: realName }
                    : o
                ),
                currentOrder:
                  String(state.currentOrder?.id) === String(enrichedOrder.id)
                    ? { ...state.currentOrder, restaurantName: realName }
                    : state.currentOrder,
              }));
            })
            .catch(() => { });

          return enrichedOrder;

        } catch (e) {
          set({ isPlacing: false });
          throw e;
        }
      },

      // ─── Update order status (called by socket / useOrders hook) ──────────
      // status arrives as raw .NET enum string e.g. 'confirmed', 'out_for_delivery'
      setOrderStatus: (orderId, status) =>
        set(state => {
          const mappedStatus = STATUS_MAP[status] ?? status;
          const sigId = String(orderId);

          const updatedOrders = state.orders.map(order =>
            String(order.id) === sigId
              ? { ...order, order_status: status, status: mappedStatus }
              : order
          );

          const updatedCurrent =
            String(state.currentOrder?.id) === sigId
              ? { ...state.currentOrder, order_status: status, status: mappedStatus }
              : state.currentOrder;

          return { orders: updatedOrders, currentOrder: updatedCurrent };
        }),

      // ─── Local cancel (after API call succeeds) ────────────────────────────
      cancelOrder: orderId =>
        set(state => ({
          orders: state.orders.map(o =>
            String(o.id) === String(orderId)
              ? { ...o, order_status: 'cancelled', status: 'Cancelled' }
              : o
          ),
          currentOrder:
            String(state.currentOrder?.id) === String(orderId)
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
        get().orders.find(o => String(o.id) === String(id)) ?? null,

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