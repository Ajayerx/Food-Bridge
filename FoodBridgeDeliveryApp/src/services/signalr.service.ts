import {
  HubConnectionBuilder,
  HubConnection,
  LogLevel,
  HubConnectionState,
} from '@microsoft/signalr';
import {useAuthStore} from '@/stores/auth.store';
import {useDispatchStore} from '@/stores/dispatch.store';
import type {DispatchOffer} from '@/types/dispatch.types';

const HUB_URL = __DEV__
  ? 'http://10.0.2.2:5196/hubs/notifications'
  : 'https://api.foodbridge.app/hubs/notifications';

let connection: HubConnection | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isConnecting = false;

function getToken(): string {
  return useAuthStore.getState().token ?? '';
}

export async function connectSignalR(): Promise<void> {
  if (
    connection &&
    connection.state === HubConnectionState.Connected
  ) {
    return;
  }

  if (isConnecting) {
    return;
  }

  isConnecting = true;

  try {
    connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: getToken,
        transport: 1, // WebSockets
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    connection.onreconnecting(() => {
      isConnecting = false;
    });

    connection.onreconnected(async () => {
      isConnecting = false;
      await joinDispatchGroup();
    });

    connection.onclose(() => {
      isConnecting = false;
      scheduleReconnect();
    });

    // ── Dispatch offer events ──
    connection.on('newDispatchOffer', (offer: DispatchOffer) => {
      useDispatchStore.getState().setCurrentOffer(offer);
    });

    connection.on('dispatchOfferAccepted', (data: {offerId: string; agentId: string}) => {
      const current = useDispatchStore.getState().currentOffer;
      if (current?.id === data.offerId) {
        useDispatchStore.getState().clearOffer();
      }
    });

    connection.on('dispatchOfferExpired', (data: {offerId: string}) => {
      const current = useDispatchStore.getState().currentOffer;
      if (current?.id === data.offerId) {
        useDispatchStore.getState().clearOffer();
      }
    });

    connection.on('taskUpdate', (data: any) => {
      // Handled by individual screens via query invalidation
    });

    await connection.start();
    await joinDispatchGroup();
  } catch (err) {
    console.warn('[SignalR] Connection failed:', err);
    scheduleReconnect();
  } finally {
    isConnecting = false;
  }
}

async function joinDispatchGroup(): Promise<void> {
  if (!connection || connection.state !== HubConnectionState.Connected) {
    return;
  }
  try {
    await connection.invoke('JoinDispatchGroup');
  } catch {
    // ignore
  }
}

async function leaveDispatchGroup(): Promise<void> {
  if (!connection || connection.state !== HubConnectionState.Connected) {
    return;
  }
  try {
    await connection.invoke('LeaveDispatchGroup');
  } catch {
    // ignore
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  reconnectTimer = setTimeout(() => {
    connectSignalR();
  }, 5000);
}

export async function disconnectSignalR(): Promise<void> {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (connection) {
    await leaveDispatchGroup();
    await connection.stop();
    connection = null;
  }
}
