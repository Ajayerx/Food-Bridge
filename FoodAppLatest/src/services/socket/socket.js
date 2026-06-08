import 'react-native-url-polyfill/auto';
import * as signalR from '@microsoft/signalr';
import { BASE_URL } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HUB_URL = BASE_URL.replace('/v1', '/hubs/orders');

class OrderSocket {
    constructor() {
        this.connection = null;
        this._listeners = {};
        this._pendingListeners = {};
        this._connecting = false;
        this._intentionalStop = false;
    }

    async connect() {
        if (this.connection?.state === signalR.HubConnectionState.Connected) return;
        if (this._connecting) return;

        this._connecting = true;
        this._intentionalStop = false;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: async () =>
                    (await AsyncStorage.getItem('access_token')) ?? '',
                transport: signalR.HttpTransportType.WebSockets,
                skipNegotiation: true,
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        // Apply any listeners registered before connect() was called
        Object.entries(this._pendingListeners).forEach(([event, handlers]) => {
            handlers.forEach(h => this.connection.on(event, h));
        });
        this._pendingListeners = {};

        this.connection.onreconnected(() => {
            console.log('🔄 Order SignalR reconnected');
        });

        this.connection.onclose((err) => {
            this._connecting = false;
            if (this._intentionalStop) {
                console.log('✅ Order SignalR disconnected intentionally');
            } else {
                console.log('❌ Order SignalR closed unexpectedly:', err?.message);
            }
        });

        try {
            await this.connection.start();
            console.log('✅ Order SignalR connected');
        } catch (err) {
            if (!this._intentionalStop) {
                console.log('❌ Order SignalR error:', err?.message);
            }
        } finally {
            this._connecting = false;
        }
    }

    async emit(event, ...args) {
        if (this.connection?.state !== signalR.HubConnectionState.Connected) {
            await this.connect();
        }
        try {
            const method = event.charAt(0).toUpperCase() + event.slice(1);
            await this.connection.invoke(method, ...args);
        } catch (err) {
            console.log(`SignalR emit error [${event}]:`, err?.message);
        }
    }

    on(event, handler) {
        // ✅ THE FIX: normalize to PascalCase to match what SignalR server sends
        const key = event.charAt(0).toUpperCase() + event.slice(1);
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
        // ✅ Same normalization so off() matches what on() registered
        const key = event.charAt(0).toUpperCase() + event.slice(1);
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
        } catch (_) { }
        this.connection = null;
        this._listeners = {};
        this._pendingListeners = {};
    }
}

export const socket = new OrderSocket();