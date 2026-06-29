export interface AgentRegistrationRequest {
  mobileNumber: string;
  fullName: string;
  email?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
}

export interface AgentRegistrationResponse {
  agentId: string;
  message: string;
}

export interface LoginRequest {
  mobileNumber: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    expiresIn: number;
  };
}

export interface OtpVerificationRequest {
  mobileNumber: string;
  otp: string;
  deviceInfo?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  agent: {
    id: string;
    fullName: string;
    mobileNumber: string;
    status: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
}
