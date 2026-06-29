import api from './client';
import type {DeliveryAgent} from '@/types/agent.types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

export const agentApi = {
  getProfile: () => api.get<ApiResponse<DeliveryAgent>>('/delivery/profile'),

  toggleAvailability: (isOnline: boolean, lat?: number, lng?: number) =>
    api.patch<ApiResponse<void>>('/delivery/availability', {
      is_available: isOnline,
      ...(lat !== undefined ? {current_latitude: lat} : {}),
      ...(lng !== undefined ? {current_longitude: lng} : {}),
    }),
};
