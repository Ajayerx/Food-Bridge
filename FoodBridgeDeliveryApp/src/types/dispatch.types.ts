export enum DispatchOfferStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Expired = 'Expired',
}

export interface DispatchOffer {
  id: string;
  orderId: string;
  orderCode: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantLatitude: number;
  restaurantLongitude: number;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  customerName: string;
  distanceKm: number;
  earnings: number;
  expiresAt: string;
  status: DispatchOfferStatus;
  createdAt: string;
}

export interface NewDispatchOfferEvent {
  offerId: string;
  offer: DispatchOffer;
}

export interface DispatchOfferAcceptedEvent {
  offerId: string;
  agentId: string;
}

export interface DispatchOfferExpiredEvent {
  offerId: string;
}
