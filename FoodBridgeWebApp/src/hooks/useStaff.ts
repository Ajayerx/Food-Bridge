import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { staffService, type StaffApiRow } from "../services/staff.service";
import { useRestaurant } from "./useRestaurant";

export function useStaff() {
    const { restaurant } = useRestaurant();
    const rid = restaurant?.id;
    const qc = useQueryClient();

    const invalidate = () =>
        qc.invalidateQueries({ queryKey: ["staff", rid] });

    // ── Query ──────────────────────────────────────────────────────────────────
    const { data: staff, isLoading, isError } = useQuery<StaffApiRow[]>({
        queryKey: ["staff", rid],
        enabled: !!rid,
        staleTime: 30_000,
        queryFn: async () => {
            const res = await staffService.getStaff(rid!);
            return res.data.data ?? [];
        },
    });

    // ── Add ────────────────────────────────────────────────────────────────────
    const addStaff = useMutation({
        mutationFn: (data: {
            mobileNumber: string;
            fullName?: string;
            email?: string;
            staffRole: string;
        }) => staffService.addStaff(rid!, data),
        onSuccess: () => {
            invalidate();
            message.success("Staff member added successfully");
        },
        onError: (e: any) =>
            message.error(
                e?.response?.data?.error?.message ??
                e?.response?.data?.message ??
                "Failed to add staff member"
            ),
    });

    // ── Update ─────────────────────────────────────────────────────────────────
    const updateStaff = useMutation({
        mutationFn: ({
            staffId,
            data,
        }: {
            staffId: string;
            data: { fullName?: string; email?: string; staffRole: string };
        }) => staffService.updateStaff(rid!, staffId, data),
        onSuccess: () => {
            invalidate();
            message.success("Staff member updated successfully");
        },
        onError: (e: any) =>
            message.error(
                e?.response?.data?.error?.message ??
                e?.response?.data?.message ??
                "Failed to update staff member"
            ),
    });

    // ── Remove ─────────────────────────────────────────────────────────────────
    const removeStaff = useMutation({
        mutationFn: (staffId: string) => staffService.removeStaff(rid!, staffId),
        onSuccess: () => {
            invalidate();
            message.success("Staff member removed successfully");
        },
        onError: (e: any) =>
            message.error(
                e?.response?.data?.error?.message ??
                e?.response?.data?.message ??
                "Failed to remove staff member"
            ),
    });

    return {
        staff: staff ?? [],
        isLoading,
        isError,
        addStaff,
        updateStaff,
        removeStaff,
    };
}