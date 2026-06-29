import React from 'react';
import {View, Text, type ViewStyle} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const STATUS_COLORS: Record<string, {bg: string; text: string}> = {
  Pending: {bg: '#fffbeb', text: '#b45309'},
  Active: {bg: '#f0fdf4', text: '#15803d'},
  Approved: {bg: '#f0fdf4', text: '#15803d'},
  Delivered: {bg: '#f0fdf4', text: '#15803d'},
  Rejected: {bg: '#fff5f5', text: '#dc2626'},
  Expired: {bg: '#f3f4f6', text: '#6b7280'},
  Cancelled: {bg: '#fff5f5', text: '#dc2626'},
  Preparing: {bg: '#eff6ff', text: '#1d4ed8'},
  OutForDelivery: {bg: '#faf5ff', text: '#7c3aed'},
  ReadyForPickup: {bg: '#fffbeb', text: '#b45309'},
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  color,
  bgColor,
  size = 'md',
  style,
}) => {
  const {borderRadius: br} = useTheme();
  const defaulted = STATUS_COLORS[label] ?? {
    bg: bgColor ?? '#f3f4f6',
    text: color ?? '#374151',
  };

  const fontSize = size === 'sm' ? 11 : 12;
  const paddingV = size === 'sm' ? 2 : 3;
  const paddingH = size === 'sm' ? 8 : 10;

  return (
    <View
      style={[
        {
          backgroundColor: defaulted.bg,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
          borderRadius: br.round,
          alignSelf: 'flex-start',
        },
        style,
      ]}>
      <Text
        style={{
          fontSize,
          fontWeight: '600',
          color: defaulted.text,
        }}>
        {label}
      </Text>
    </View>
  );
};
