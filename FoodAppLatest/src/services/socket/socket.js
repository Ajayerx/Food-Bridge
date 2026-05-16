// services/socket/socket.js

// ✅ Must polyfill URL before importing SignalR
import 'react-native-url-polyfill/auto';

import * as signalR from '@microsoft/signalr';
import { BASE_URL } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HUB_URL = BASE_URL.replace('/v1', '/hubs/orders');
const NOTIFICATION_HUB_URL = BASE_URL.replace('/v1', '/hubs/notifications');

class OrderSocket {
    constructor() {
        this.connection = null;
        this._listeners = {};
    }

    async connect() {
        if (this.connection?.state === signalR.HubConnectionState.Connected) return;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: async () => {
                    return (await AsyncStorage.getItem('access_token')) ?? '';
                },
                // ✅ Force WebSockets — avoids long-polling which also uses URL parsing
                transport: signalR.HttpTransportType.WebSockets,
                skipNegotiation: true,
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        this.connection.onreconnected(() => {
            Object.entries(this._listeners).forEach(([event, handlers]) => {
                handlers.forEach(h => this.connection.on(event, h));
            });
        });

        try {
            await this.connection.start();
            console.log('✅ SignalR connected');
        } catch (err) {
            console.log('❌ SignalR connect error:', err?.message);
        }
    }

    async disconnect() {
        await this.connection?.stop();
        this.connection = null;
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
        if (!this._listeners[event]) this._listeners[event] = [];
        if (!this._listeners[event].includes(handler)) {
            this._listeners[event].push(handler);
            this.connection?.on(event, handler);
        }
    }

    off(event, handler) {
        if (this._listeners[event]) {
            this._listeners[event] = this._listeners[event].filter(h => h !== handler);
        }
        this.connection?.off(event, handler);
    }
}

export const socket = new OrderSocket();