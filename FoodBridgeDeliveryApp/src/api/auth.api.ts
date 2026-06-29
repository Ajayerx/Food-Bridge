import api from './client';
import type {
  AgentRegistrationRequest,
  AgentRegistrationResponse,
  LoginRequest,
  LoginResponse,
  OtpVerificationRequest,
  AuthResponse,
} from '@/types/auth.types';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export const authApi = {
  register: (data: AgentRegistrationRequest) =>
    api.post<ApiResponse<AgentRegistrationResponse>>('/auth/agent/register', {
      mobile_number: data.mobileNumber,
      full_name: data.fullName,
      ...(data.email ? {email: data.email} : {}),
      ...(data.vehicleType ? {vehicle_type: data.vehicleType} : {}),
      ...(data.vehicleNumber ? {vehicle_number: data.vehicleNumber} : {}),
      ...(data.licenseNumber ? {license_number: data.licenseNumber} : {}),
    }),

  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>('/auth/request-otp', data),

  verifyOtp: (data: OtpVerificationRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/verify-otp', {
      mobileNumber: data.mobileNumber,
      otp: data.otp,
      device_info: data.deviceInfo,
    }),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/refresh', {refreshToken}),
};
