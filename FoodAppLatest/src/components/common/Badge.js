import React, { useMemo } from 'react';
import {View, Text, StyleSheet} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export const Badge = ({count, style}) => {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  if (!count || count === 0) return null;
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

const createStyles = (C) => StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: C.error,
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  text: {
    color: C.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
