import api from './client';
import type {Task} from '@/types/order.types';
import type {OrderStatus} from '@/types/order.types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

export const taskApi = {
  getTasks: () =>
    api.get<ApiResponse<Task[]>>('/delivery/tasks'),

  getTaskById: (id: string) =>
    api.get<ApiResponse<Task>>(`/delivery/tasks/${id}`),

  updateTaskStatus: (taskId: string, status: OrderStatus, reason?: string) =>
    api.patch<ApiResponse<void>>(`/delivery/tasks/${taskId}/status`, {
      status,
      ...(reason ? {reason} : {}),
    }),

  getActiveTask: () =>
    api.get<ApiResponse<Task | null>>('/delivery/tasks/active'),
};
