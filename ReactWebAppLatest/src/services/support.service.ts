import api from "../lib/apiClient";
import type { ApiResponse } from "types";

// Schema: CreateTicketRequestDto  { order_id?, subject, message }
// Schema: SendMessageRequestDto   { message, attachment_url? }
// Schema: UpdateTicketStatusRequestDto  { status }

export function normalizeTicket(t: any) {
    return {
        id: t.id,
        userId: t.user_id,
        orderId: t.order_id ?? null,
        subject: t.subject,
        status: t.status,
        category: t.category,
        assignedTo: t.assigned_to ?? null,
        messages: (t.messages ?? []).map((m: any) => ({
            id: m.id,
            ticketId: m.ticket_id,
            senderId: m.sender_id,
            senderRole: m.sender_role,
            message: m.message,
            attachmentUrl: m.attachment_url ?? null,
            createdAt: m.created_at,
        })),
        createdAt: t.created_at,
        updatedAt: t.updated_at ?? t.created_at,
    };
}

export const supportService = {
    // GET /v1/support/tickets
    getTickets: (params?: { status?: string; page?: number; limit?: number }) =>
        api.get<ApiResponse<any[]>>("/support/tickets", { params }),

    // GET /v1/support/tickets/{id}
    getTicket: (ticketId: string) =>
        api.get<ApiResponse<any>>(`/support/tickets/${ticketId}`),

    // POST /v1/support/tickets  →  CreateTicketRequestDto
    // Schema: { order_id?, subject, message }
    // NOTE: schema has no "category" field — removed from body
    createTicket: (data: {
        subject: string;
        category?: string;   // kept for FE form compat but not sent to backend
        orderId?: string;
        message: string;
    }) =>
        api.post<ApiResponse<any>>("/support/tickets", {
            order_id: data.orderId ?? null,
            subject: data.subject,
            message: data.message,
        }),

    // POST /v1/support/tickets/{id}/messages  →  SendMessageRequestDto
    // Schema: { message, attachment_url? }
    replyTicket: (ticketId: string, message: string, attachmentUrl?: string) =>
        api.post<ApiResponse<any>>(`/support/tickets/${ticketId}/messages`, {
            message,
            attachment_url: attachmentUrl ?? null,
        }),

    // PATCH /v1/support/tickets/{id}/status  →  UpdateTicketStatusRequestDto
    // Schema: { status }  — /status suffix added
    updateStatus: (ticketId: string, status: string) =>
        api.patch<ApiResponse<any>>(`/support/tickets/${ticketId}/status`, {
            status,
        }),
};