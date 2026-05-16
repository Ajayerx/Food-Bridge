import { useEffect, useRef } from 'react';
import { socket } from './socket';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSocket = () => {
    const didConnect = useRef(false); // ✅ ref survives re-renders, blocks double connect

    useEffect(() => {
        if (didConnect.current) return; // ✅ already connected in this mount cycle
        didConnect.current = true;

        AsyncStorage.getItem('access_token').then(token => {
            if (token) socket.connect();
        });

        return () => {
            didConnect.current = false;
        };
    }, []);
};