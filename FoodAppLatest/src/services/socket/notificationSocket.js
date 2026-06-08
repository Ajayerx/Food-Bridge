import 'react-native-url-polyfill/auto';
import * as signalR from '@microsoft/signalr';
import { BASE_URL } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HUB_URL = BASE_URL.replace('/v1', '/hubs/notifications');

class NotificationSocket {
    constructor() {
        this.connection = null;
        this._listeners = {};
        this._pendingListeners = {};
        this._connecting = false;      // ✅ tracks in-progress connect
        this._intentionalStop = false; // ✅ tracks deliberate disconnect
    }

    async connect() {
        // ✅ Already connected or connection in progress — bail out
        if (this.connection?.state === signalR.HubConnectionState.Connected) return;
        if (this._connecting) return;

        this._connecting = true;
        this._intentionalStop = false;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: async () =>
                    (await AsyncStorage.getItem('access_token')) ?? '',
                // ✅ Skip HTTP negotiation — connects directly via WebSocket
                // This is what stops the "stopped during negotiation" error
                transport: signalR.HttpTransportType.WebSockets,
                skipNegotiation: true,
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        // ✅ Apply listeners registered before connect() was called
        Object.entries(this._pendingListeners).forEach(([event, handlers]) => {
            handlers.forEach(h => this.connection.on(event, h));
        });
        this._pendingListeners = {};

        // ✅ onreconnected: don't re-register — SignalR keeps handlers across reconnects
        this.connection.onreconnected(() => {
            console.log('🔄 Notification SignalR reconnected');
        });

        this.connection.onclose((err) => {
            this._connecting = false;
            if (this._intentionalStop) {
                console.log('✅ Notification SignalR disconnected intentionally');
            } else {
                console.log('❌ Notification SignalR closed unexpectedly:', err?.message);
            }
        });

        try {
            await this.connection.start();
            console.log('✅ Notification SignalR connected');
        } catch (err) {
            // ✅ Suppress error if we intentionally stopped mid-negotiation
            if (!this._intentionalStop) {
                console.log('❌ Notification SignalR error:', err?.message);
            }
        } finally {
            this._connecting = false;
        }
    }

    on(event, handler) {
        const key = event;   // ← remove .toLowerCase()
        if (!this._listeners[key]) this._listeners[key] = [];
        if (this._listeners[key].includes(handler)) return;
        this._listeners[key].push(handler);

        if (this.connection) {
            this.connection.on(key, handler);
        } else {
            if (!this._pendingListeners[key]) this._pendingListeners[key] = [];
            this._pendingListeners[key].push(handler);
        }
    }

    off(event, handler) {
        const key = event;   // ← remove .toLowerCase()
        if (this._listeners[key]) {
            this._listeners[key] = this._listeners[key].filter(h => h !== handler);
        }
        this.connection?.off(key, handler);
    }

    async disconnect() {
        this._intentionalStop = true;
        this._connecting = false;

        try {
            await this.connection?.stop();
        } catch (_) {
            // Already stopped or mid-negotiation — safe to ignore
        }

        this.connection = null;
        this._listeners = {};
        this._pendingListeners = {};
    }
}

export const notificationSocket = new NotificationSocket();