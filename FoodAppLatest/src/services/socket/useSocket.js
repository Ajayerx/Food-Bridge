// services/socket/useSocket.js
import { useEffect } from 'react';
import { socket } from './socket';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSocket = () => {
    useEffect(() => {
        // Connect only if user has a token
        AsyncStorage.getItem('access_token').then(token => {
            if (token) socket.connect();
        });

        return () => {
            // Keep connection alive across screens — don't disconnect on unmount
        };
    }, []);
};