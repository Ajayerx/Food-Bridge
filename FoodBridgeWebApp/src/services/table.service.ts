import api from "../lib/apiClient";
import type { ApiResponse } from "../types";

export interface TableApiRow {
    id: string;
    restaurant_id: string;
    table_number: string;
    capacity: number;
    status: string;
}

// Maps string → int for API writes
const statusMap: Record<string, number> = {
    Available: 0,
    Occupied: 1,
    Reserved: 2,
    OutOfService: 3,
};

export const tableService = {
    getTables: (restaurantId: string) =>
        api.get<ApiResponse<TableApiRow[]>>(`/restaurants/${restaurantId}/tables`),

    createTable: (restaurantId: string, data: { tableNumber: string; capacity: number }) =>
        api.post<ApiResponse<TableApiRow>>(`/restaurants/${restaurantId}/tables`, {
            table_number: data.tableNumber,
            capacity: data.capacity,
        }),

    updateTable: (
        restaurantId: string,
        tableId: string,
        data: { tableNumber?: string; capacity?: number; status?: string }
    ) => {
        const body: Record<string, any> = {};
        if (data.tableNumber !== undefined) body.table_number = data.tableNumber;
        if (data.capacity !== undefined) body.capacity = data.capacity;
        if (data.status !== undefined) body.status = statusMap[data.status] ?? 0; // ← send int

        return api.put<ApiResponse<TableApiRow>>(
            `/restaurants/${restaurantId}/tables/${tableId}`,
            body
        );
    },

    deleteTable: (restaurantId: string, tableId: string) =>
        api.delete<ApiResponse<void>>(`/restaurants/${restaurantId}/tables/${tableId}`),

    reserveTable: (restaurantId: string, tableId: string) =>
        api.patch<ApiResponse<void>>(
            `/restaurants/${restaurantId}/tables/${tableId}/reserve`
        ),
};