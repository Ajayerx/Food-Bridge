import {useEffect, useRef} from 'react';
import {useAuthStore} from '@/stores/auth.store';
import {
  connectSignalR,
  disconnectSignalR,
} from '@/services/signalr.service';

let globalConnected = false;

export function useSignalR() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const token = useAuthStore(s => s.token);
  const prevTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && token && !globalConnected) {
      globalConnected = true;
      connectSignalR();
    }

    if (!isAuthenticated && globalConnected) {
      globalConnected = false;
      disconnectSignalR();
    }

    prevTokenRef.current = token;

    return () => {
      // Don't disconnect on unmount — connection is global
    };
  }, [isAuthenticated, token]);
}
