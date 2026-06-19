import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { userService } from "../services/user.service";
import type { GetUsersParams } from "../services/user.service";
import type { ApiUser, RoleType } from "../types";

const PAGE_SIZE = 20;

export function useUsers() {
    const qc = useQueryClient();

    // ── Filters ───────────────────────────────────────────────────────────────
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<RoleType | "all">("all");

    const queryParams: GetUsersParams = {
        page,
        limit: PAGE_SIZE,
        role: roleFilter !== "all" ? roleFilter : undefined,
        search: search || undefined,
    };

    // ── Query ─────────────────────────────────────────────────────────────────
    const { data: rows = [], isLoading, isError, isFetching } = useQuery({
        queryKey: ["admin-users", queryParams],
        queryFn: async () => {
            const res = await userService.getUsers(queryParams);
            // Backend returns: { success: true, data: ApiUser[] }
            return res.data.data ?? [];
        },
        placeholderData: (prev) => prev,
        staleTime: 30_000,
        retry: false,
    });

    // ── Suspend / Reactivate ──────────────────────────────────────────────────
    const toggleStatus = useMutation({
        mutationFn: ({ id, makeActive }: { id: string; makeActive: boolean }) =>
            userService.setUserStatus(id, makeActive),
        onSuccess: (_res, { makeActive }) => {
            message.success(makeActive ? "User reactivated" : "User suspended");
            qc.invalidateQueries({ queryKey: ["admin-users"] });
        },
        onError: (e: any) =>
            message.error(
                e?.response?.data?.error?.message ?? "Failed to update user status"
            ),
    });

    return {
        rows,           // ApiUser[] directly
        isLoading,
        isError,
        isFetching,

        search, setSearch,
        roleFilter, setRoleFilter,
        page, setPage,
        pageSize: PAGE_SIZE,
        total: rows.length, // no meta from backend, use array length

        toggleStatus,
    };
}