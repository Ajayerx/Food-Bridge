import {useMemo} from 'react';
import {StyleSheet} from 'react-native';
import {useTheme, type Theme} from './ThemeProvider';

export function createStyles<T extends Record<string, any>>(
  factory: (theme: Theme) => T,
): () => T {
  return () => {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)) as T, [theme]);
  };
}
