import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';
import {Card} from '@/components/ui/Card';
import {StatusBadge} from './StatusBadge';
import type {Task} from '@/types/order.types';

interface ActiveTaskCardProps {
  task: Task;
  onPress: () => void;
}

export const ActiveTaskCard: React.FC<ActiveTaskCardProps> = ({
  task,
  onPress,
}) => {
  const {colors, spacing} = useTheme();

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card
        style={{
          borderLeftWidth: 4,
          borderLeftColor: colors.primary,
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <View>
            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                fontWeight: '600',
              }}>
              Active Delivery
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.textPrimary,
                marginTop: spacing.xxs,
              }}>
              #{task.order.orderCode}
            </Text>
          </View>
          <StatusBadge status={task.status} />
        </View>

        <View
          style={{
            marginTop: spacing.md,
            gap: spacing.xs,
          }}>
          <Text style={{fontSize: 13, color: colors.textSecondary}}>
            🏪 {task.order.restaurantName}
          </Text>
          <Text style={{fontSize: 13, color: colors.textSecondary}}>
            📍 {task.order.deliveryAddress}
          </Text>
        </View>

        <View
          style={{
            marginTop: spacing.md,
            paddingTop: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.borderLight,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.success,
            }}>
            ₹{task.order.agentEarnings.toFixed(0)}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.primary,
            }}>
            {task.distanceKm.toFixed(1)} km
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};
