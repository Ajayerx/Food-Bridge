import React from 'react';
import {View, Text, ScrollView, RefreshControl} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/theme/ThemeProvider';
import {useDashboard} from '@/hooks/useDashboard';
import {useAuthStore} from '@/stores/auth.store';
import {AvailabilityToggle} from '@/components/AvailabilityToggle';
import {EarningsCard} from '@/components/EarningsCard';
import {ActiveTaskCard} from '@/components/ActiveTaskCard';
import {RecentTasksList} from '@/components/RecentTasksList';
import {EmptyState} from '@/components/EmptyState';
import type {Task} from '@/types/order.types';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({navigation}) => {
  const {colors, spacing, typography} = useTheme();
  const insets = useSafeAreaInsets();
  const fullName = useAuthStore(s => s.fullName);
  const {activeTask, recentTasks, isLoading, refresh} = useDashboard();

  const handleTaskPress = (task: Task) => {
    navigation.navigate('TaskDetail', {taskId: task.id, task});
  };

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: colors.background}}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingBottom: insets.bottom + spacing.xxl,
        paddingHorizontal: spacing.lg,
      }}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refresh} />
      }>
      {/* Greeting */}
      <Text
        style={[
          typography.h2,
          {color: colors.textPrimary, marginBottom: spacing.xxs},
        ]}>
        Hello, {fullName?.split(' ')[0] || 'Agent'}
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: colors.textSecondary,
          marginBottom: spacing.xl,
        }}>
        Ready for another great day?
      </Text>

      {/* Availability Toggle */}
      <View style={{marginBottom: spacing.lg}}>
        <AvailabilityToggle />
      </View>

      {/* Earnings */}
      <View style={{marginBottom: spacing.lg}}>
        <EarningsCard />
      </View>

      {/* Active Task */}
      {activeTask && (
        <View style={{marginBottom: spacing.lg}}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}>
            Current Delivery
          </Text>
          <ActiveTaskCard
            task={activeTask}
            onPress={() => handleTaskPress(activeTask)}
          />
        </View>
      )}

      {/* No active task state */}
      {!activeTask && !isLoading && (
        <View style={{marginBottom: spacing.lg}}>
          <EmptyState
            icon="🛵"
            title="No Active Deliveries"
            description="Turn on your availability above to start receiving delivery offers in real-time."
          />
        </View>
      )}

      {/* Recent Tasks */}
      <RecentTasksList
        tasks={recentTasks}
        loading={isLoading}
        onTaskPress={handleTaskPress}
      />
    </ScrollView>
  );
};
