// services/api/base.js

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../../constants/config";

const api = axios.create({
  baseURL: BASE_URL,         // ← from config, port 5196
  timeout: 10000,
});

// Attach token automatically
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Auto refresh on 401
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

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

        // ✅ .NET RefreshRequestDto property is RefreshToken
        //    snake_case_lower serializer means the key is: refresh_token
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token,
        });

        // ✅ .NET returns { success, data: { access_token, refresh_token, ... } }
        //    because of snake_case_lower serializer
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
        await AsyncStorage.multiRemove(["access_token", "refresh_token", "user"]);
        const { useUserStore } = require("../../store/userStore");
        useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    console.log("❌ API ERROR URL:", error.config?.url);
    console.log("❌ ERROR DATA:", error.response?.data);
    return Promise.reject(error);
  }
);

export default api;