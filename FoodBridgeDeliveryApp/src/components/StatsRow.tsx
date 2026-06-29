import React from 'react';
import {View, Text} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';

interface StatsRowProps {
  totalDeliveries: number;
  totalEarnings: number;
  averageRating: number;
}

export const StatsRow: React.FC<StatsRowProps> = ({
  totalDeliveries,
  totalEarnings,
  averageRating,
}) => {
  const {colors, spacing, borderRadius: br} = useTheme();

  const stats = [
    {label: 'Deliveries', value: totalDeliveries.toString(), color: colors.primary},
    {label: 'Earnings', value: `₹${totalEarnings.toLocaleString('en-IN')}`, color: colors.success},
    {label: 'Rating', value: averageRating.toFixed(1), color: colors.warning},
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceVariant,
        borderRadius: br.lg,
        overflow: 'hidden',
      }}>
      {stats.map((s, idx) => (
        <View
          key={s.label}
          style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: spacing.md,
            borderRightWidth: idx < stats.length - 1 ? 1 : 0,
            borderRightColor: colors.border,
          }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: s.color,
            }}>
            {s.value}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: colors.textSecondary,
              marginTop: spacing.xxs,
              fontWeight: '500',
            }}>
            {s.label}
          </Text>
        </View>
      ))}
    </View>
  );
};
