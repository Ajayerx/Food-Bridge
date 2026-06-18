import React, { useMemo } from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export const Chip = ({label, active, onPress, style}) => {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.active, style]}
      onPress={onPress}
      activeOpacity={0.7}>
      <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
    </TouchableOpacity>
  );
};

const createStyles = (C) => StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
  },
  active: {
    backgroundColor: C.primaryLight,
    borderColor: C.primary,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textSecondary,
  },
  activeText: {
    color: C.primary,
    fontWeight: '600',
  },
});
