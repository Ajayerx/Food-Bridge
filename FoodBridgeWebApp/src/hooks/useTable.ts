import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { tableService, type TableApiRow } from "../services/table.service";
import { useRestaurant } from "./useRestaurant";

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTable() {
    const { restaurant } = useRestaurant();
    const rid = restaurant?.id;
    const qc = useQueryClient();

    const invalidate = () =>
        qc.invalidateQueries({ queryKey: ["tables", rid] });

    // ── Query ──────────────────────────────────────────────────────────────────
    const {
        data: tables,
        isLoading,
        isError,
    } = useQuery<TableApiRow[]>({
        queryKey: ["tables", rid],
        enabled: !!rid,
        staleTime: 30_000,
        queryFn: async () => {
            const res = await tableService.getTables(rid!);
            return res.data.data ?? [];
        },
    });

    // ── Create ─────────────────────────────────────────────────────────────────
    const createTable = useMutation({
        mutationFn: (data: { tableNumber: string; capacity: number }) =>
            tableService.createTable(rid!, data),
        onSuccess: () => {
            invalidate();
            message.success("Table created successfully");
        },
        onError: (e: any) =>
            message.error(
                e?.response?.data?.message ?? e?.message ?? "Failed to create table"
            ),
    });

    // ── Update ─────────────────────────────────────────────────────────────────
    const updateTable = useMutation({
        mutationFn: ({
            tableId,
            data,
        }: {
            tableId: string;
            data: { tableNumber?: string; capacity?: number; status?: string };  // ← replaces isAvailable
        }) => tableService.updateTable(rid!, tableId, data),
        onSuccess: () => {
            invalidate();
            message.success("Table updated successfully");
        },
        onError: (e: any) =>
            message.error(
                e?.response?.data?.message ?? e?.message ?? "Failed to update table"
            ),
    });
    // ── Delete ─────────────────────────────────────────────────────────────────
    const deleteTable = useMutation({
        mutationFn: (tableId: string) => tableService.deleteTable(rid!, tableId),
        onSuccess: () => {
            invalidate();
            message.success("Table deleted successfully");
        },
        onError: (e: any) =>
            message.error(
                e?.response?.data?.message ?? e?.message ?? "Failed to delete table"
            ),
    });

    // ── Reserve (assign table only, no order) ─────────────────────────────────
    const reserveTable = useMutation({
        mutationFn: (tableId: string) =>
            tableService.reserveTable(rid!, tableId),
        onSuccess: () => {
            invalidate();
            message.success("Table reserved successfully");
        },
        onError: (e: any) =>
            message.error(
                e?.response?.data?.message ?? e?.message ?? "Failed to reserve table"
            ),
    });

    return {
        tables: tables ?? [],
        isLoading,
        isError,
        createTable,
        updateTable,
        deleteTable,
        reserveTable,
    };
}