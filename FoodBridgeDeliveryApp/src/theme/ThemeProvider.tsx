import React, {createContext, useContext, useMemo} from 'react';
import {useColorScheme} from 'react-native';
import {lightColors, darkColors} from './colors';
import {typography} from './typography';
import {spacing, borderRadius, iconSize} from './spacing';
import {useThemeStore} from '@/stores/theme.store';

export type Theme = {
  colors: typeof lightColors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  iconSize: typeof iconSize;
  isDark: boolean;
};

const ThemeContext = createContext<Theme | undefined>(undefined);

export const useTheme = (): Theme => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};

type ThemeProviderProps = {
  children: React.ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  const systemScheme = useColorScheme();
  const isDarkMode = useThemeStore(s => s.isDarkMode);
  const effectiveDark =
    isDarkMode ?? systemScheme === 'dark';

  const theme = useMemo<Theme>(
    () => ({
      colors: (effectiveDark ? darkColors : lightColors) as typeof lightColors,
      typography,
      spacing,
      borderRadius,
      iconSize,
      isDark: effectiveDark,
    }),
    [effectiveDark],
  );

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};
