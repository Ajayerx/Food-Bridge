import {useState} from 'react';
import {Alert} from 'react-native';
import {useDispatchStore} from '@/stores/dispatch.store';
import {useAgentStore} from '@/stores/agent.store';
import {dispatchApi} from '@/api/dispatch.api';

export function useDispatchOffer() {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const currentOffer = useDispatchStore(s => s.currentOffer);
  const clearOffer = useDispatchStore(s => s.clearOffer);
  const hideModal = useDispatchStore(s => s.hideModal);
  const setOffline = useAgentStore(s => s.setOffline);

  const acceptOffer = async () => {
    if (!currentOffer) {
      return;
    }
    setIsAccepting(true);
    try {
      await dispatchApi.acceptOffer(currentOffer.id);
      clearOffer();
      setOffline();
    } catch (e: any) {
      const msg =
        e?.response?.data?.error?.message ??
        'Failed to accept offer. It may have been taken by another agent.';
      Alert.alert('Offer Unavailable', msg);
      clearOffer();
    } finally {
      setIsAccepting(false);
    }
  };

  const rejectOffer = async () => {
    if (!currentOffer) {
      return;
    }
    setIsRejecting(true);
    try {
      await dispatchApi.rejectOffer(currentOffer.id);
    } catch {
      // Rejection failures are non-critical
    } finally {
      clearOffer();
      setIsRejecting(false);
    }
  };

  const dismissOffer = () => {
    hideModal();
  };

  return {
    currentOffer,
    isAccepting,
    isRejecting,
    acceptOffer,
    rejectOffer,
    dismissOffer,
  };
}
