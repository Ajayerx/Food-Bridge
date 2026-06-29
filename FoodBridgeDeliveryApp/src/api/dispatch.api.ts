import api from './client';

export const dispatchApi = {
  acceptOffer: (offerId: string) =>
    api.post<{success: boolean; message: string}>(
      `/dispatch/offers/${offerId}/accept`,
    ),

  rejectOffer: (offerId: string) =>
    api.post<{success: boolean; message: string}>(
      `/dispatch/offers/${offerId}/reject`,
    ),
};
