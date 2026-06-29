import {useState, useCallback} from 'react';
import {Alert, Linking, PermissionsAndroid, Platform} from 'react-native';
import {useAgentStore} from '@/stores/agent.store';
import {agentApi} from '@/api/agent.api';

export function useAvailability() {
  const [isLoading, setIsLoading] = useState(false);
  const isOnline = useAgentStore(s => s.isOnline);
  const setOnline = useAgentStore(s => s.setOnline);
  const setOffline = useAgentStore(s => s.setOffline);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'FoodBridge needs access to your location to show nearby delivery offers.',
            buttonPositive: 'Grant',
            buttonNegative: 'Deny',
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        }

        if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Location Required',
            'Location permission was permanently denied. Please enable it in Settings.',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Open Settings', onPress: () => Linking.openSettings()},
            ],
          );
          return false;
        }

        return false;
      } catch {
        return false;
      }
    }
    return true;
  };

  const getCurrentPosition = (): Promise<{lat: number; lng: number}> => {
    return new Promise((resolve, reject) => {
      const geo = (navigator as any).geolocation;
      if (!geo) {
        reject(new Error('Geolocation not available'));
        return;
      }
      geo.getCurrentPosition(
        (pos: any) => resolve({lat: pos.coords.latitude, lng: pos.coords.longitude}),
        (err: any) => reject(err),
        {enableHighAccuracy: true, timeout: 10000, maximumAge: 30000},
      );
    });
  };

  const toggle = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!isOnline) {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          Alert.alert(
            'Permission Denied',
            'Location permission is required to receive delivery offers.',
          );
          setIsLoading(false);
          return;
        }
      }

      let lat: number | undefined;
      let lng: number | undefined;

      if (!isOnline) {
        try {
          const pos = await getCurrentPosition();
          lat = pos.lat;
          lng = pos.lng;
        } catch {
          // proceed without location
        }
      }

      await agentApi.toggleAvailability(!isOnline, lat, lng);

      if (isOnline) {
        setOffline();
      } else {
        setOnline(lat, lng);
      }
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.error?.message ?? 'Failed to update availability.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, setOnline, setOffline]);

  return {
    isOnline,
    isLoading,
    toggle,
  };
}
