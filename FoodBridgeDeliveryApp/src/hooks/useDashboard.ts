import {useState, useEffect, useCallback} from 'react';
import {useAgentStore} from '@/stores/agent.store';
import {taskApi} from '@/api/task.api';
import {agentApi} from '@/api/agent.api';
import type {Task} from '@/types/order.types';
import type {DeliveryAgent} from '@/types/agent.types';

export function useDashboard() {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const updateStats = useAgentStore(s => s.updateStats);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profileRes, activeRes, tasksRes] = await Promise.all([
        agentApi.getProfile(),
        taskApi.getActiveTask(),
        taskApi.getTasks(),
      ]);

      if (profileRes.data?.data) {
        const p = profileRes.data.data as DeliveryAgent;
        updateStats(p.totalEarnings, p.totalDeliveries);
      }

      if (activeRes.data?.data) {
        setActiveTask(activeRes.data.data as Task);
      } else {
        setActiveTask(null);
      }

      if (tasksRes.data?.data) {
        const all = tasksRes.data.data as Task[];
        setRecentTasks(all.slice(0, 5));
      }
    } catch {
      // silently fail — dashboard shows cached/store values
    } finally {
      setIsLoading(false);
    }
  }, [updateStats]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    activeTask,
    recentTasks,
    isLoading,
    refresh: fetchDashboard,
  };
}
