import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, FlatList, RefreshControl} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/theme/ThemeProvider';
import {TaskCard} from '@/components/TaskCard';
import {FilterChips} from '@/components/FilterChips';
import {EmptyState} from '@/components/EmptyState';
import {taskApi} from '@/api/task.api';
import type {Task} from '@/types/order.types';

const FILTERS = [
  {key: 'all', label: 'All'},
  {key: 'Assigned', label: 'Active'},
  {key: 'Delivered', label: 'Completed'},
  {key: 'Failed', label: 'Failed'},
];

interface TaskListScreenProps {
  navigation: any;
}

export const TaskListScreen: React.FC<TaskListScreenProps> = ({navigation}) => {
  const {colors, spacing, typography} = useTheme();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await taskApi.getTasks();
      setTasks(res.data?.data ?? []);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks =
    selectedFilter === 'all'
      ? tasks
      : tasks.filter(t => t.status === selectedFilter);

  const handleTaskPress = (task: Task) => {
    navigation.navigate('TaskDetail', {taskId: task.id, task});
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top + spacing.lg,
      }}>
      {/* Header */}
      <View style={{paddingHorizontal: spacing.lg, marginBottom: spacing.lg}}>
        <Text
          style={[
            typography.h2,
            {color: colors.textPrimary, marginBottom: spacing.xxs},
          ]}>
          My Deliveries
        </Text>
        <Text style={{fontSize: 13, color: colors.textSecondary}}>
          {filteredTasks.length} delivery
          {filteredTasks.length !== 1 ? 'ies' : 'y'}
        </Text>
      </View>

      {/* Filters */}
      <View style={{paddingHorizontal: spacing.lg, marginBottom: spacing.lg}}>
        <FilterChips
          chips={FILTERS}
          selected={selectedFilter}
          onSelect={setSelectedFilter}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={{paddingHorizontal: spacing.lg}}>
            <TaskCard task={item} onPress={handleTaskPress} />
          </View>
        )}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchTasks} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="📋"
              title="No Deliveries Found"
              description={
                selectedFilter === 'all'
                  ? 'You haven\'t completed any deliveries yet. Go online to start receiving offers.'
                  : `No deliveries with status "${selectedFilter}"`
              }
            />
          ) : null
        }
      />
    </View>
  );
};
