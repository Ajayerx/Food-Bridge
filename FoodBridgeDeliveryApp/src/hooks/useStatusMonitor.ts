import {useEffect, useRef, useCallback} from 'react';
import {AppState} from 'react-native';
import {useAuthStore} from '@/stores/auth.store';
import {agentApi} from '@/api/agent.api';
import {AgentStatus} from '@/types/agent.types';

export function useStatusMonitor() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const status = useAuthStore(s => s.status);
  const logout = useAuthStore(s => s.logout);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const res = await agentApi.getProfile();
      const profileStatus = res.data?.data?.status;
      if (profileStatus && profileStatus !== AgentStatus.Active) {
        logout();
      }
    } catch {
      // network errors silently ignored
    }
  }, [logout]);

  useEffect(() => {
    if (!isAuthenticated || status !== AgentStatus.Active) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    checkStatus();

    intervalRef.current = setInterval(checkStatus, 60_000);

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        checkStatus();
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, [isAuthenticated, status, checkStatus]);
}
