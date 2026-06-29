import api from './client';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

export const supportApi = {
  createTicket: (subject: string, message: string, orderId?: string) =>
    api.post<ApiResponse<{id: string}>>('/support/tickets', {
      subject,
      message,
      order_id: orderId || null,
    }),
};
