import React from 'react';
import {View, Text, TouchableOpacity, Switch} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightContent?: React.ReactNode;
  toggle?: {
    value: boolean;
    onToggle: (value: boolean) => void;
  };
}

export const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  onPress,
  showArrow = true,
  rightContent,
  toggle,
}) => {
  const {colors, spacing} = useTheme();

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md + 2,
        paddingHorizontal: spacing.lg,
        minHeight: 52,
      }}>
      <View style={{width: 28, alignItems: 'center'}}>{icon}</View>
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          color: colors.textPrimary,
          marginLeft: spacing.md,
        }}>
        {label}
      </Text>
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onToggle}
          trackColor={{false: colors.border, true: colors.successLight}}
          thumbColor={toggle.value ? colors.success : colors.textDisabled}
        />
      ) : (
        rightContent || (showArrow && (
          <Text style={{fontSize: 16, color: colors.textDisabled}}>›</Text>
        ))
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.6} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};
