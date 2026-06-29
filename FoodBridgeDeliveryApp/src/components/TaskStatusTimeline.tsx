import React from 'react';
import {View, Text} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';
import type {Task} from '@/types/order.types';

interface TaskStatusTimelineProps {
  task: Task;
}

interface TimelineStep {
  label: string;
  timestamp?: string;
  isActive: boolean;
  isCompleted: boolean;
}

export const TaskStatusTimeline: React.FC<TaskStatusTimelineProps> = ({
  task,
}) => {
  const {colors, spacing} = useTheme();

  const steps: TimelineStep[] = [
    {
      label: 'Assigned',
      timestamp: task.acceptedAt,
      isActive: true,
      isCompleted: true,
    },
    {
      label: 'Picked Up',
      timestamp: task.pickedUpAt,
      isActive: task.status === 'PickedUp',
      isCompleted: task.status === 'PickedUp' || task.status === 'Delivered',
    },
    {
      label: 'Delivered',
      timestamp: task.deliveredAt,
      isActive: task.status === 'Delivered',
      isCompleted: task.status === 'Delivered',
    },
  ];

  if (task.status === 'Failed') {
    steps.push({
      label: 'Failed',
      timestamp: task.failedAt,
      isActive: true,
      isCompleted: true,
    });
  }

  return (
    <View style={{paddingLeft: spacing.sm}}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const dotColor = step.isCompleted
          ? colors.success
          : step.isActive
          ? colors.primary
          : colors.border;
        const lineColor =
          step.isCompleted || step.isActive
            ? step.isCompleted
              ? colors.success
              : colors.primary
            : colors.border;

        return (
          <View key={step.label} style={{flexDirection: 'row'}}>
            {/* Timeline line */}
            <View style={{alignItems: 'center', width: 24}}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: dotColor,
                  borderWidth: 2,
                  borderColor: colors.surface,
                  zIndex: 1,
                }}
              />
              {!isLast && (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    backgroundColor: lineColor,
                    minHeight: 30,
                  }}
                />
              )}
            </View>

            {/* Content */}
            <View
              style={{
                flex: 1,
                paddingBottom: isLast ? 0 : spacing.lg,
                paddingLeft: spacing.md,
              }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: step.isActive ? '700' : '500',
                  color: step.isCompleted
                    ? colors.success
                    : step.isActive
                    ? colors.textPrimary
                    : colors.textDisabled,
                }}>
                {step.label}
              </Text>
              {step.timestamp && (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: spacing.xxs,
                  }}>
                  {new Date(step.timestamp).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: 'short',
                  })}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};
