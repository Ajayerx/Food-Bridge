import React, {useState} from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';
import {typography} from '@/theme/typography';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  leftIcon,
  containerStyle,
  style,
  ...props
}) => {
  const {colors, borderRadius: br, spacing} = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: spacing.xs,
          }}>
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceVariant,
          borderRadius: br.md,
          borderWidth: 1,
          borderColor: error
            ? colors.error
            : isFocused
            ? colors.primary
            : colors.border,
          paddingHorizontal: spacing.md,
          minHeight: 48,
        }}>
        {leftIcon && (
          <View style={{marginRight: spacing.sm}}>{leftIcon}</View>
        )}
        <RNTextInput
          placeholderTextColor={colors.textDisabled}
          style={[
            {
              flex: 1,
              fontSize: 14,
              color: colors.textPrimary,
              paddingVertical: spacing.md,
            },
            style,
          ]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      {error && (
        <Text
          style={{
            fontSize: 12,
            color: colors.error,
            marginTop: spacing.xs,
          }}>
          {error}
        </Text>
      )}
    </View>
  );
};
