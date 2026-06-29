import React from 'react';
import {View, Text, FlatList} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';
import {TaskCard} from './TaskCard';
import type {Task} from '@/types/order.types';

interface RecentTasksListProps {
  tasks: Task[];
  loading: boolean;
  onTaskPress: (task: Task) => void;
}

export const RecentTasksList: React.FC<RecentTasksListProps> = ({
  tasks,
  loading,
  onTaskPress,
}) => {
  const {colors, spacing} = useTheme();

  if (loading) {
    return null;
  }

  if (tasks.length === 0) {
    return (
      <View style={{alignItems: 'center', paddingVertical: spacing.xxl}}>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
          }}>
          No deliveries yet today
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text
        style={{
          fontSize: 15,
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: spacing.md,
        }}>
        Recent Deliveries
      </Text>
      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TaskCard task={item} onPress={onTaskPress} />
        )}
        scrollEnabled={false}
      />
    </View>
  );
};
