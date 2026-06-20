import { useState, useCallback } from "react";
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
        pageSize: PAGE_SIZE,
        role: roleFilter !== "all" ? roleFilter : undefined,
        search: search || undefined,
    };

    const handleSearch = useCallback((value: string) => {
        setSearch(value);
        setPage(1);
    }, []);

    const handleRoleFilter = useCallback((value: RoleType | "all") => {
        setRoleFilter(value);
        setPage(1);
    }, []);

    // ── Query ─────────────────────────────────────────────────────────────────
    const { data: result = { items: [], totalCount: 0 }, isLoading, isError, isFetching } = useQuery({
        queryKey: ["admin-users", queryParams],
        queryFn: async () => {
            const res = await userService.getUsers(queryParams);
            const mapped = res.data.data as { items: ApiUser[]; totalCount: number };
            return { items: mapped.items ?? [], totalCount: mapped.totalCount ?? 0 };
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
        rows: result.items,
        total: result.totalCount,
        isLoading,
        isError,
        isFetching,

        search, setSearch: handleSearch,
        roleFilter, setRoleFilter: handleRoleFilter,
        page, setPage,
        pageSize: PAGE_SIZE,

        toggleStatus,
    };
}