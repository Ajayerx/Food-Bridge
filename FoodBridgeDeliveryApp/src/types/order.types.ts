export enum OrderStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Preparing = 'Preparing',
  ReadyForPickup = 'ReadyForPickup',
  OutForDelivery = 'OutForDelivery',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled',
  Refunded = 'Refunded',
  DeliveryFailed = 'DeliveryFailed',
}

export enum OrderType {
  Delivery = 'Delivery',
  Pickup = 'Pickup',
  DineIn = 'DineIn',
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiers?: OrderModifier[];
}

export interface OrderModifier {
  id: string;
  name: string;
  price: number;
}

export interface Order {
  id: string;
  orderCode: string;
  status: OrderStatus;
  orderType: OrderType;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantLatitude: number;
  restaurantLongitude: number;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  agentEarnings: number;
  assignedAgentId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  readyAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

export interface Task {
  id: string;
  orderId: string;
  order: Order;
  agentId: string;
  status: TaskStatus;
  acceptedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  distanceKm: number;
}

export enum TaskStatus {
  Assigned = 'Assigned',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
  Failed = 'Failed',
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}
