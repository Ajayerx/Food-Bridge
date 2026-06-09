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
        this._connectionPromise = null;
        this._reconnectPromise = null;
        this._resolveReconnect = null;
        this._rejectReconnect = null;
        this._intentionalStop = false;
        this._onReconnected = null;
    }

    // ── Lifecycle handler helpers ──────────────────────────────────────────
    // SignalR's onreconnected / onreconnecting / onclose are single-callback
    // setters, not event emitters. We compose them so that internal logic
    // (connection tracking) and external callbacks (onReconnected) coexist.
    _setupLifecycleHandlers() {
        this.connection.onreconnecting(() => {
            console.log('🔄 Order SignalR reconnecting');
            this._connectionPromise = null;
            this._reconnectPromise = new Promise((resolve, reject) => {
                this._resolveReconnect = resolve;
                this._rejectReconnect = reject;
            });
        });

        this.connection.onreconnected(() => {
            console.log('🔄 Order SignalR reconnected');
            if (this._resolveReconnect) {
                this._resolveReconnect();
                this._resolveReconnect = null;
                this._rejectReconnect = null;
                this._reconnectPromise = null;
            }
            this._onReconnected?.();
        });

        this.connection.onclose((err) => {
            this._connectionPromise = null;
            if (this._rejectReconnect) {
                this._rejectReconnect(err || new Error('Connection closed'));
                this._resolveReconnect = null;
                this._rejectReconnect = null;
                this._reconnectPromise = null;
            }
            if (this._intentionalStop) {
                console.log('✅ Order SignalR disconnected intentionally');
            } else {
                console.log('❌ Order SignalR closed unexpectedly:', err?.message);
            }
        });
    }

    async connect() {
        // Already connected — nothing to do
        if (this.connection?.state === signalR.HubConnectionState.Connected) return;

        // Auto-reconnect is in progress — wait for it
        if (this.connection?.state === signalR.HubConnectionState.Reconnecting) {
            if (this._reconnectPromise) return this._reconnectPromise;
        }

        // A connection attempt is already in-flight — share the promise
        if (this._connectionPromise) return this._connectionPromise;

        this._intentionalStop = false;

        this._connectionPromise = (async () => {
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
            for (const [event, handlers] of Object.entries(this._pendingListeners)) {
                for (const h of handlers) {
                    this.connection.on(event, h);
                }
            }
            this._pendingListeners = {};

            this._setupLifecycleHandlers();

            try {
                await this.connection.start();
                console.log('✅ Order SignalR connected');
            } catch (err) {
                this._connectionPromise = null;
                if (!this._intentionalStop) {
                    console.log('❌ Order SignalR error:', err?.message);
                }
                throw err;
            }
        })();

        return this._connectionPromise;
    }

    onReconnected(callback) {
        this._onReconnected = callback;
    }

    async emit(event, ...args) {
        if (this.connection?.state !== signalR.HubConnectionState.Connected) {
            await this.connect();
        }
        const method = event.charAt(0).toUpperCase() + event.slice(1);
        await this.connection.invoke(method, ...args);
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
        this._connectionPromise = null;
        this._reconnectPromise = null;
        this._resolveReconnect = null;
        this._rejectReconnect = null;
        try {
            await this.connection?.stop();
        } catch (_) { }
        this.connection = null;
        this._listeners = {};
        this._pendingListeners = {};
    }
}

export const socket = new OrderSocket();