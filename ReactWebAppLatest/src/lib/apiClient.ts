import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

// In dev the Vite proxy rewrites /v1 → http://localhost:3000/v1, so we use a
// relative path. In production set VITE_API_BASE_URL to the full origin + /v1.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/v1";
const API_BASE_URL = "https://localhost:44322/v1"
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ── Request interceptor — attach access token ─────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const stored = localStorage.getItem("fb_auth_state");
  if (stored) {
    try {
      const { accessToken } = JSON.parse(stored);
      if (accessToken) {
        config.headers = config.headers ?? {};
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      }
    } catch {
      // ignore parse error
    }
  }
  return config;
});

// ── Retry queue helpers ───────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token as string);
    }
  });
  failedQueue = [];
}

function clearAuthAndRedirect() {
  localStorage.removeItem("fb_auth_state");
  sessionStorage.clear();
  window.location.href = "/auth";
}

// ── Response interceptor — silent refresh on 401 ─────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the refresh completes
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(Promise.reject.bind(Promise));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const stored = localStorage.getItem("fb_auth_state");
      if (!stored) throw new Error("No stored auth");
      const state = JSON.parse(stored);
      const refreshToken: string = state.refreshToken;
      if (!refreshToken) throw new Error("No refresh token");

      // Backend reads req.body.refresh_token (snake_case)
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      // Backend returns { success, data: { access_token, expires_in } }
      const newAccessToken: string =
        data.data?.access_token ?? data.access_token ?? data.data?.accessToken ?? data.accessToken;
      state.accessToken = newAccessToken;
      localStorage.setItem("fb_auth_state", JSON.stringify(state));

      processQueue(null, newAccessToken);

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;