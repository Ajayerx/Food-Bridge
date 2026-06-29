import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  isDarkMode: boolean | null;
  toggleTheme: () => void;
  setDarkMode: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      isDarkMode: null,

      toggleTheme: () =>
        set(state => ({isDarkMode: !(state.isDarkMode ?? false)})),

      setDarkMode: (dark: boolean) => set({isDarkMode: dark}),
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
