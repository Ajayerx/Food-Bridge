import { create } from 'zustand';
import AsyncStorage from "@react-native-async-storage/async-storage";

const DARK_MODE_KEY = 'app_dark_mode';

export const useUserStore = create((set, get) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  darkMode: false,
  isLoggingOut: false,

  initUser: async () => {
    try {
      const [user, token, darkMode] = await Promise.all([
        AsyncStorage.getItem("user"),
        AsyncStorage.getItem("access_token"),
        AsyncStorage.getItem(DARK_MODE_KEY),
      ]);

      const parsed = user ? JSON.parse(user) : null;

      set({
        user: parsed,
        isLoggedIn: !!(parsed && token),
        isLoading: false,
        darkMode: darkMode === 'true',
      });

      // Fetch fresh profile in background — don't await
      if (parsed && token) {
        get().fetchProfile();
      }
    } catch (e) {
      console.log("initUser error:", e.message);
      set({ isLoading: false });
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
    if (user != null) {
      AsyncStorage.setItem("user", JSON.stringify(user));
      set({ user, isLoggedIn: true });
    } else {
      AsyncStorage.removeItem("user");
      set({ user: null, isLoggedIn: false });
    }
  },

  logout: async () => {
    if (get().isLoggingOut) return;

    // ✅ Step 1: Raise the flag FIRST — interceptor starts blocking immediately
    set({ isLoggingOut: true });

    // ✅ Step 2: Small tick to let the flag propagate before any async work
    await new Promise(resolve => setTimeout(resolve, 50));

    // ✅ Step 3: Call logout API (token still valid at this point)
    try {
      const { logout: logoutAPI } = require('../services/auth/authService');
      await logoutAPI();
    } catch (_) {
      // Network failure — still proceed
    }

    // ✅ Step 4: Now safe to wipe storage — interceptor is already blocking
    await AsyncStorage.clear();

    // ✅ Step 5: Reset all stores
    require('./cartStore').useCartStore.getState().clearCart();
    require('./orderStore').useOrderStore.getState().clearOrders();
    require('./notificationStore').useNotificationStore.getState().clearAll();
    require('./addressStore').useAddressStore.setState({
      addresses: [],
      selectedAddress: null,
    });

    // ✅ Step 6: Reset user store — navigator switches to Login
    set({
      user: null,
      isLoggedIn: false,
      isLoading: false,
      darkMode: false,
      isLoggingOut: false,   // ← release the flag last
    });
  },

  toggleDarkMode: (next) => {
    const value = typeof next === 'boolean' ? next : !get().darkMode;
    set({ darkMode: value });
    AsyncStorage.setItem(DARK_MODE_KEY, String(value)).catch(() => {});
  },
}));