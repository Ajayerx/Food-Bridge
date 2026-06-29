import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';
import {Card} from '@/components/ui/Card';
import {StatusBadge} from './StatusBadge';
import type {Task} from '@/types/order.types';

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({task, onPress}) => {
  const {colors, spacing, typography} = useTheme();

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => onPress(task)}>
      <Card style={{marginBottom: spacing.md}}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
          <View style={{flex: 1}}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: colors.textPrimary,
              }}>
              #{task.order.orderCode}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                marginTop: spacing.xxs,
              }}>
              {task.order.restaurantName}
            </Text>
          </View>
          <StatusBadge status={task.status} />
        </View>

        <View
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            marginTop: spacing.md,
            paddingTop: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.borderLight,
          }}>
          <View style={{flex: 1}}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
              Distance
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.textPrimary,
                marginTop: spacing.xxs,
              }}>
              {task.distanceKm.toFixed(1)} km
            </Text>
          </View>
          <View style={{flex: 1}}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
              Earnings
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.success,
                marginTop: spacing.xxs,
              }}>
              ₹{task.order.agentEarnings.toFixed(0)}
            </Text>
          </View>
          <View style={{flex: 1}}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
              Time
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.textPrimary,
                marginTop: spacing.xxs,
              }}>
              {new Date(task.acceptedAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginTop: spacing.md,
          }}>
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              flex: 1,
            }}
            numberOfLines={1}>
            📍 {task.order.deliveryAddress}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};
