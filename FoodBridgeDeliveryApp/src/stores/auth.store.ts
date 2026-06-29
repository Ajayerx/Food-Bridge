import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AuthResponse} from '@/types/auth.types';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  agentId: string | null;
  fullName: string | null;
  mobileNumber: string | null;
  isAuthenticated: boolean;
  status: string | null;

  setAuth: (res: AuthResponse) => void;
  updateProfile: (name: string) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      agentId: null,
      fullName: null,
      mobileNumber: null,
      isAuthenticated: false,
      status: null,

      setAuth: (res: AuthResponse) =>
        set({
          token: res.token,
          refreshToken: res.refreshToken,
          agentId: res.agent.id,
          fullName: res.agent.fullName,
          mobileNumber: res.agent.mobileNumber,
          isAuthenticated: true,
          status: res.agent.status,
        }),

      updateProfile: (name: string) => set({fullName: name}),

      logout: () =>
        set({
          token: null,
          refreshToken: null,
          agentId: null,
          fullName: null,
          mobileNumber: null,
          isAuthenticated: false,
          status: null,
        }),

      hydrate: async () => {
        try {
          const raw = await AsyncStorage.getItem('auth-store');
          if (raw) {
            const parsed = JSON.parse(raw);
            set({
              token: parsed.state?.token ?? null,
              refreshToken: parsed.state?.refreshToken ?? null,
              agentId: parsed.state?.agentId ?? null,
              fullName: parsed.state?.fullName ?? null,
              mobileNumber: parsed.state?.mobileNumber ?? null,
              isAuthenticated: parsed.state?.isAuthenticated ?? false,
              status: parsed.state?.status ?? null,
            });
          }
        } catch {
          // ignore hydrate errors
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        token: state.token,
        refreshToken: state.refreshToken,
        agentId: state.agentId,
        fullName: state.fullName,
        mobileNumber: state.mobileNumber,
        isAuthenticated: state.isAuthenticated,
        status: state.status,
      }),
    },
  ),
);
