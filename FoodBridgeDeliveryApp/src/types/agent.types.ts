export enum AgentStatus {
  Pending = 'Pending',
  Active = 'Active',
  Inactive = 'Inactive',
  Banned = 'Banned',
  Rejected = 'Rejected',
}

export enum VehicleType {
  Bicycle = 'Bicycle',
  Motorcycle = 'Motorcycle',
  Scooter = 'Scooter',
  Car = 'Car',
  Van = 'Van',
  OnFoot = 'OnFoot',
}

export interface DeliveryAgent {
  id: string;
  userId: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  avatarUrl?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  status: AgentStatus;
  isAvailable: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  totalEarnings: number;
  totalDeliveries: number;
  createdAt: string;
}

export interface AgentProfile {
  id: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  avatarUrl?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  totalEarnings: number;
  totalDeliveries: number;
  averageRating: number;
}
