import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:5196/v1'
  : 'https://api.foodbridge.app/v1';

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function transformKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(transformKeys);
  }
  if (value !== null && typeof value === 'object') {
    const obj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      obj[snakeToCamel(key)] = transformKeys(val);
    }
    return obj;
  }
  return value;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

api.interceptors.response.use(
  response => {
    if (response.data && typeof response.data === 'object') {
      response.data = transformKeys(response.data) as typeof response.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const { token: newToken, refreshToken: newRefresh } = res.data.data;

          useAuthStore.getState().setAuth({
            ...res.data.data,
            agent: useAuthStore.getState(),
          });

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }
      }

      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  },
);

export default api;
