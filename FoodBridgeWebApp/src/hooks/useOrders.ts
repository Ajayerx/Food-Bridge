// useOrders.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRestaurant } from "./useRestaurant";
import { orderService, normalizeOrder } from "../services/order.service";
import type { Order, OrderStatus } from "types";

// useOrders.ts
export function useOrders() {
    const { restaurant } = useRestaurant();
    const qc = useQueryClient();
    const restaurantId = restaurant?.id;  // ← capture it

    const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useQuery({
        queryKey: ["vendor-orders", restaurantId],
        enabled: !!restaurantId,
        queryFn: async () => {
            const res = await orderService.getRestaurantOrders(restaurantId!, { limit: 200 });
            const rawList: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
            return rawList.map((raw) => normalizeOrder(raw));
        },
        refetchInterval: 15_000,
        refetchIntervalInBackground: false,
        staleTime: 10_000,
    });

    const updateStatus = useMutation({
        mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
            orderService.updateStatus(id, status),
        onSuccess: (_, vars) => {
            // ✅ FIXED: include restaurantId so only THIS restaurant's cache is invalidated
            qc.invalidateQueries({ queryKey: ["vendor-orders", restaurantId] });
            qc.invalidateQueries({ queryKey: ["order-detail", vars.id] });
        },
    });

    const cancelOrder = useMutation({
        mutationFn: (id: string) =>
            orderService.cancelOrder(id, "Cancelled by vendor"),
        onSuccess: (_, id) => {
            // ✅ FIXED
            qc.invalidateQueries({ queryKey: ["vendor-orders", restaurantId] });
            qc.invalidateQueries({ queryKey: ["order-detail", id] });
        },
    });

    const assignAgent = useMutation({
        mutationFn: ({ orderId, agentId }: { orderId: string; agentId: string }) =>
            orderService.assignAgent(orderId, agentId),
        onSuccess: (_, vars) => {
            // ✅ FIXED
            qc.invalidateQueries({ queryKey: ["vendor-orders", restaurantId] });
            qc.invalidateQueries({ queryKey: ["order-detail", vars.orderId] });
        },
    });

    return { orders: data ?? [] as Order[], isLoading, isFetching, dataUpdatedAt, refetch, updateStatus, cancelOrder, assignAgent };
}