import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  size = 'md',
  style,
  textStyle,
  icon,
}) => {
  const {colors, borderRadius: br, spacing, typography} = useTheme();

  const variantStyles: Record<ButtonVariant, {bg: string; text: string}> = {
    primary: {bg: colors.primary, text: colors.textOnPrimary},
    secondary: {bg: colors.surfaceVariant, text: colors.textPrimary},
    danger: {bg: colors.error, text: colors.white},
    ghost: {bg: colors.transparent, text: colors.primary},
  };

  const sizeStyles: Record<string, {py: number; px: number; fs: number}> = {
    sm: {py: spacing.sm, px: spacing.lg, fs: 13},
    md: {py: spacing.md, px: spacing.xl, fs: 15},
    lg: {py: spacing.lg, px: spacing.xxl, fs: 16},
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        {
          backgroundColor: disabled ? colors.textDisabled : v.bg,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          borderRadius: br.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        icon
      )}
      <Text
        style={[
          {
            color: disabled ? colors.white : v.text,
            fontSize: s.fs,
            fontWeight: '700',
            textAlign: 'center',
          },
          textStyle,
        ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};
