import {create} from 'zustand';
import type {DispatchOffer} from '@/types/dispatch.types';

interface DispatchState {
  currentOffer: DispatchOffer | null;
  offerStartTime: number | null;
  isModalVisible: boolean;

  setCurrentOffer: (offer: DispatchOffer) => void;
  clearOffer: () => void;
  showModal: () => void;
  hideModal: () => void;
}

export const useDispatchStore = create<DispatchState>()(set => ({
  currentOffer: null,
  offerStartTime: null,
  isModalVisible: false,

  setCurrentOffer: (offer: DispatchOffer) =>
    set({
      currentOffer: offer,
      offerStartTime: Date.now(),
      isModalVisible: true,
    }),

  clearOffer: () =>
    set({
      currentOffer: null,
      offerStartTime: null,
      isModalVisible: false,
    }),

  showModal: () => set({isModalVisible: true}),
  hideModal: () => set({isModalVisible: false}),
}));
