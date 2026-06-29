// useAgents.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { agentService, type AgentApiRow } from "../services/agent.service";

export function useAgents() {
    const qc = useQueryClient();

    const invalidate = () =>
        qc.invalidateQueries({ queryKey: ["agents"] });

    // ── Query ──────────────────────────────────────────────────────────────────
    const { data: agents = [], isLoading, isError } = useQuery<AgentApiRow[]>({
        queryKey: ["agents"],
        staleTime: 30_000,
        queryFn: async () => {
            const res = await agentService.getAgents();
            return res.data.data ?? [];
        },
    });

    // ── Add ────────────────────────────────────────────────────────────────────
    const addAgent = useMutation({
        mutationFn: (data: {
            mobileNumber: string;
            fullName: string;
            email?: string;
            vehicleType?: string;
            vehicleNumber?: string;
            licenseNumber?: string;
        }) => agentService.addAgent(data),
        onSuccess: () => {
            invalidate();
            message.success("Delivery agent added successfully");
        },
        onError: (e: any) =>
            message.error(
                e?.response?.data?.error?.message ?? "Failed to add agent"
            ),
    });

    // ── Update ─────────────────────────────────────────────────────────────────
    const updateAgent = useMutation({
        mutationFn: ({ id, data }: {
            id: string;
            data: {
                fullName?: string;
                email?: string;
                vehicleType?: string;
                vehicleNumber?: string;
                licenseNumber?: string;
            };
        }) => agentService.updateAgent(id, data),
        onSuccess: () => {
            invalidate();
            message.success("Agent updated successfully");
        },
        onError: (e: any) =>
            message.error(
                e?.response?.data?.error?.message ?? "Failed to update agent"
            ),
    });

    // ── Delete ─────────────────────────────────────────────────────────────────
    const deleteAgent = useMutation({
        mutationFn: (id: string) => agentService.deleteAgent(id),
        onSuccess: () => {
            invalidate();
            message.success("Agent removed successfully");
        },
        onError: (e: any) =>
            message.error(
                e?.response?.data?.error?.message ?? "Failed to remove agent"
            ),
    });

    // ── Approve ────────────────────────────────────────────────────────────────
    const approveAgent = useMutation({
        mutationFn: (id: string) => agentService.approveAgent(id),
        onSuccess: () => {
            invalidate();
            message.success("Agent approved successfully");
        },
        onError: (e: any) =>
            message.error(
                e?.response?.data?.error?.message ?? "Failed to approve agent"
            ),
    });

    // ── Suspend ────────────────────────────────────────────────────────────────
    const suspendAgent = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            agentService.suspendAgent(id, reason),
        onSuccess: () => {
            invalidate();
            message.success("Agent suspended successfully");
        },
        onError: (e: any) =>
            message.error(
                e?.response?.data?.error?.message ?? "Failed to suspend agent"
            ),
    });

    // ── Unsuspend ──────────────────────────────────────────────────────────────
    const unsuspendAgent = useMutation({
        mutationFn: (id: string) => agentService.unsuspendAgent(id),
        onSuccess: () => {
            invalidate();
            message.success("Agent unsuspended successfully");
        },
        onError: (e: any) =>
            message.error(
                e?.response?.data?.error?.message ?? "Failed to unsuspend agent"
            ),
    });

    // ── Reject ─────────────────────────────────────────────────────────────────
    const rejectAgent = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            agentService.rejectAgent(id, reason),
        onSuccess: () => {
            invalidate();
            message.success("Agent rejected");
        },
        onError: (e: any) =>
            message.error(
                e?.response?.data?.error?.message ?? "Failed to reject agent"
            ),
    });

    return {
        agents,
        isLoading,
        isError,
        addAgent,
        updateAgent,
        deleteAgent,
        approveAgent,
        rejectAgent,
        suspendAgent,
        unsuspendAgent,
    };
}