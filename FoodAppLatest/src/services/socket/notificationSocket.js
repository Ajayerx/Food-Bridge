import 'react-native-url-polyfill/auto';
import * as signalR from '@microsoft/signalr';
import { BASE_URL } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HUB_URL = BASE_URL.replace('/v1', '/hubs/notifications');

class NotificationSocket {
    constructor() {
        this.connection = null;
        this._listeners = {};
        this._pendingListeners = {}; // ✅ store before connect
    }

    async connect() {
        if (this.connection?.state === signalR.HubConnectionState.Connected) return;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: async () =>
                    (await AsyncStorage.getItem('access_token')) ?? '',
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        // ✅ Apply any listeners registered before connect() was called
        Object.entries(this._pendingListeners).forEach(([event, handlers]) => {
            handlers.forEach(h => this.connection.on(event, h));
        });
        this._pendingListeners = {};

        this.connection.onreconnected(() => {
            console.log('🔄 Notification SignalR reconnected');
            Object.entries(this._listeners).forEach(([event, handlers]) =>
                handlers.forEach(h => this.connection.on(event, h))
            );
        });

        this.connection.onclose((err) => {
            console.log('❌ Notification SignalR closed:', err?.message);
        });

        try {
            await this.connection.start();
            console.log('✅ Notification SignalR connected');
        } catch (err) {
            console.log('❌ Notification SignalR error:', err?.message);
        }
    }

    on(event, handler) {
        // ✅ Normalize to lowercase — SignalR JS always delivers lowercase
        const key = event.toLowerCase();
        if (!this._listeners[key]) this._listeners[key] = [];
        if (this._listeners[key].includes(handler)) return;
        this._listeners[key].push(handler);

        if (this.connection) {
            // Already have connection object — register directly
            this.connection.on(key, handler);
        } else {
            // ✅ No connection yet — queue it for when connect() is called
            if (!this._pendingListeners[key]) this._pendingListeners[key] = [];
            this._pendingListeners[key].push(handler);
        }
    }

    off(event, handler) {
        const key = event.toLowerCase();
        if (this._listeners[key]) {
            this._listeners[key] = this._listeners[key].filter(h => h !== handler);
        }
        this.connection?.off(key, handler);
    }

    async disconnect() {
        await this.connection?.stop();
        this.connection = null;
    }
}

export const notificationSocket = new NotificationSocket();