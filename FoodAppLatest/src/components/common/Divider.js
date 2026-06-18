import React, { useMemo } from 'react';
import {View, StyleSheet} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export const Divider = ({style, thick = false}) => {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return <View style={[styles.divider, thick && styles.thick, style]} />;
};

const createStyles = (C) => StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: C.divider,
    width: '100%',
  },
  thick: {
    height: 8,
    backgroundColor: C.background,
  },
});
