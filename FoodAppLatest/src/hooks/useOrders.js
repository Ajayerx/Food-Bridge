import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrders } from "../services/order/orderService";
import { socket } from "../services/socket/socket";

const STATUS_MAP = {
  placed: "Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  completed: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const ACTIVE_STATUSES = [
  "Placed", "Confirmed", "Preparing", "Ready for Pickup", "Out for Delivery",
];

export const useOrders = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleStatusUpdate = (data) => {
      console.log("📦 useOrders socket update:", data);
      queryClient.setQueryData(["orders"], (oldOrders) => {
        if (!Array.isArray(oldOrders)) return oldOrders;
        return oldOrders.map((order) =>
          order.id === data.orderId
            ? {
              ...order,
              order_status: data.status,
              status: STATUS_MAP[data.status] ?? data.status,
            }
            : order
        );
      });
    };

    socket.on("orderStatusUpdated", handleStatusUpdate);
    return () => socket.off("orderStatusUpdated", handleStatusUpdate);
  }, [queryClient]);
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await getOrders();
      const orders = res?.data ?? [];

      return orders.map((order) => {
        const cachedRestaurant = queryClient.getQueryData([
          "restaurantDetail", order.restaurant_id,
        ]);

        return {
          ...order,
          restaurantId: order.restaurant_id,
          status: STATUS_MAP[order.order_status] ?? order.order_status,
          order_status: order.order_status,
          createdAt: order.created_at,
          total: parseFloat(order.total_amount || 0),
          restaurantName:
            cachedRestaurant?.name
            ?? order.restaurant_name
            ?? "Restaurant",
          items: (order.items ?? []).map((i) => ({
            ...i,
            id: i.menu_item_id ?? i.id,
            name: i.item_name ?? i.name,
            price: i.unit_price ?? i.price,
            unit_price_snapshot: i.unit_price,
            item_name_snapshot: i.item_name,
            menu_item_id: i.menu_item_id,
            quantity: i.quantity ?? 1,
          })),
        };
      });
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,            // ✅ keep cache 5 mins
    refetchOnWindowFocus: false,       // ✅ don't refetch on app focus
    refetchOnMount: false,             // ✅ use cache if fresh
    refetchInterval: (query) => {
      const data = query?.state?.data;
      if (!Array.isArray(data) || data.length === 0) return false;
      const hasActive = data.some((o) =>
        ACTIVE_STATUSES.includes(STATUS_MAP[o.order_status] ?? o.status ?? '')
      );
      return hasActive ? 15000 : false;
    },
    refetchIntervalInBackground: false,
  });
};