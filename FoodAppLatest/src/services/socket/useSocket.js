import { useEffect, useRef } from 'react';
import { socket } from './socket';
import { notificationSocket } from './notificationSocket';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSocket = () => {
    const didConnect = useRef(false);

    useEffect(() => {
        if (didConnect.current) return;
        didConnect.current = true;

        AsyncStorage.getItem('access_token').then(token => {
            if (token) {
                socket.connect();
                notificationSocket.connect();
            }
        });

        return () => {
            didConnect.current = false;
        };
    }, []);
};