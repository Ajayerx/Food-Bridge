import React from 'react';
import {View, Text} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';
import {Card} from '@/components/ui/Card';
import {useAgentStore} from '@/stores/agent.store';

export const EarningsCard: React.FC = () => {
  const {colors, spacing} = useTheme();
  const totalEarnings = useAgentStore(s => s.totalEarnings);
  const totalDeliveries = useAgentStore(s => s.totalDeliveries);

  return (
    <Card>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: colors.textSecondary,
          marginBottom: spacing.md,
        }}>
        Today's Summary
      </Text>
      <View
        style={{
          flexDirection: 'row',
          gap: spacing.lg,
        }}>
        <View style={{flex: 1}}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}>
            Earnings
          </Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: colors.success,
              marginTop: spacing.xxs,
            }}>
            ₹{(totalEarnings ?? 0).toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={{flex: 1}}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}>
            Deliveries
          </Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: colors.primary,
              marginTop: spacing.xxs,
            }}>
            {totalDeliveries}
          </Text>
        </View>
      </View>
    </Card>
  );
};
