import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export const Button = ({ title, onPress, loading, disabled, style, variant = 'primary' }) => {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'secondary' && styles.secondary,
        disabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (C) => StyleSheet.create({
  button: {
    backgroundColor: C.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
  },
  secondary: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.primary,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: C.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    color: C.primary,
  },
});
