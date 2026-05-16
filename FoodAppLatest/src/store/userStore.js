import { create } from 'zustand';
import AsyncStorage from "@react-native-async-storage/async-storage";

const DARK_MODE_KEY = 'app_dark_mode';

export const useUserStore = create((set, get) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  darkMode: false,

  initUser: async () => {
    const user = await AsyncStorage.getItem("user");
    const token = await AsyncStorage.getItem("access_token");
    // ✅ Restore dark mode preference
    const darkMode = await AsyncStorage.getItem(DARK_MODE_KEY);
    const parsed = user ? JSON.parse(user) : null;

    set({
      user: parsed,
      isLoggedIn: !!(parsed && token),
      isLoading: false,
      darkMode: darkMode === 'true',
    });

    if (parsed && token) {
      get().fetchProfile();
    }
  },

  fetchProfile: async () => {
    try {
      const { default: api } = await import('../services/api/base');
      const res = await api.get('/me');
      const profile = res.data?.data;
      if (!profile) return;

      const updatedUser = {
        user_id: profile.user_id,
        full_name: profile.full_name,
        mobile_number: profile.mobile_number,
        email: profile.email,
        avatar_url: profile.avatar_url,
        role: profile.role,
        status: profile.status,
      };

      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      set({ user: updatedUser });
    } catch (e) {
      console.log("fetchProfile error:", e?.response?.data || e.message);
    }
  },

  setUser: (user) => {
    AsyncStorage.setItem("user", JSON.stringify(user));
    set({ user, isLoggedIn: true });
  },

  logout: async () => {
    try {
      const { logout: logoutAPI } = await import('../services/auth/authService');
      await logoutAPI();
    } catch (_) { }
    await AsyncStorage.multiRemove(["access_token", "refresh_token", "user"]);
    set({ user: null, isLoggedIn: false });
  },

  // ✅ Persist dark mode toggle
  toggleDarkMode: async () => {
    const next = !get().darkMode;
    await AsyncStorage.setItem(DARK_MODE_KEY, String(next));
    set({ darkMode: next });
  },
}));