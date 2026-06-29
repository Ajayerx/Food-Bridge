import {create} from 'zustand';

interface AgentState {
  isOnline: boolean;
  currentLatitude: number | null;
  currentLongitude: number | null;
  totalEarnings: number;
  totalDeliveries: number;

  setOnline: (lat?: number, lng?: number) => void;
  setOffline: () => void;
  updateLocation: (lat: number, lng: number) => void;
  updateStats: (earnings: number, deliveries: number) => void;
  reset: () => void;
}

const initialState = {
  isOnline: false,
  currentLatitude: null as number | null,
  currentLongitude: null as number | null,
  totalEarnings: 0,
  totalDeliveries: 0,
};

export const useAgentStore = create<AgentState>()(set => ({
  ...initialState,

  setOnline: (lat, lng) =>
    set({
      isOnline: true,
      currentLatitude: lat ?? null,
      currentLongitude: lng ?? null,
    }),

  setOffline: () =>
    set({
      isOnline: false,
    }),

  updateLocation: (lat, lng) =>
    set({
      currentLatitude: lat,
      currentLongitude: lng,
    }),

  updateStats: (earnings, deliveries) =>
    set({
      totalEarnings: earnings,
      totalDeliveries: deliveries,
    }),

  reset: () => set(initialState),
}));
