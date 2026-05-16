import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../../constants/config";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// ── Attach token ────────────────────────────────────────────────────────────
api.interceptors.request.use(
  async config => {
    // ✅ Block all requests mid-logout
    const isLoggingOut = require("../../store/userStore")
      .useUserStore.getState().isLoggingOut;
    if (isLoggingOut) {
      const controller = new AbortController();
      controller.abort();
      config.signal = controller.signal;
      return config;
    }

    const token = await AsyncStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error)
);

// ── Auto refresh on 401 ─────────────────────────────────────────────────────
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // ✅ If request was aborted (mid-logout), swallow silently
    if (axios.isCancel(error) || error.code === "ERR_CANCELED") {
      return Promise.resolve(null);
    }

    // ✅ If already logging out, swallow all errors silently
    const { useUserStore } = require("../../store/userStore");
    if (useUserStore.getState().isLoggingOut) {
      return Promise.resolve(null);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh") &&
      !originalRequest.url.includes("/auth/logout")
    ) {
      originalRequest._retry = true;

      try {
        const refresh_token = await AsyncStorage.getItem("refresh_token");
        if (!refresh_token) throw new Error("No refresh token");

        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token,
        });

        const new_access_token = res.data?.data?.access_token;
        const new_refresh_token = res.data?.data?.refresh_token;

        if (!new_access_token) throw new Error("Refresh failed");

        await AsyncStorage.setItem("access_token", new_access_token);
        if (new_refresh_token) {
          await AsyncStorage.setItem("refresh_token", new_refresh_token);
        }

        originalRequest.headers.Authorization = `Bearer ${new_access_token}`;
        return api(originalRequest);

      } catch (refreshError) {
        // ✅ Don't call logout() if already logging out
        if (!useUserStore.getState().isLoggingOut) {
          await AsyncStorage.multiRemove(["access_token", "refresh_token", "user"]);
          useUserStore.getState().logout();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;