import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/colors';

export const Button = ({ title, onPress, loading, disabled, style, variant = 'primary' }) => (
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

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
  },
  secondary: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    color: Colors.primary,
  },
});
