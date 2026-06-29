import React from 'react';
import {Badge} from '@/components/ui/Badge';

interface StatusBadgeProps {
  status: string;
}

const STATUS_MAP: Record<string, {label: string}> = {
  Pending: {label: 'Pending'},
  Confirmed: {label: 'Confirmed'},
  Preparing: {label: 'Preparing'},
  ReadyForPickup: {label: 'Ready'},
  OutForDelivery: {label: 'Out for Delivery'},
  Delivered: {label: 'Delivered'},
  Cancelled: {label: 'Cancelled'},
  Refunded: {label: 'Refunded'},
  DeliveryFailed: {label: 'Failed'},
  Assigned: {label: 'Assigned'},
  PickedUp: {label: 'Picked Up'},
  Active: {label: 'Active'},
  Inactive: {label: 'Inactive'},
  Rejected: {label: 'Rejected'},
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({status}) => {
  const mapped = STATUS_MAP[status] ?? {label: status};
  return <Badge label={mapped.label} />;
};
