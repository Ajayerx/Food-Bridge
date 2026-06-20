import api from "../lib/apiClient";
import type { ApiLoginResponse, ApiResponse } from 'types';

export const authService = {
    // POST /v1/auth/request-otp  →  { mobileNumber }
    requestOtp: (mobileNumber: string) =>
        api.post("/auth/request-otp", { mobileNumber }),

    // POST /v1/auth/verify-otp  →  { mobileNumber, otp, device_info? }
    verifyOtp: (mobileNumber: string, otp: string, deviceInfo?: string) =>
        api.post("/auth/verify-otp", {
            mobileNumber,
            otp,
            device_info: deviceInfo ?? null,
        }),

    // POST /v1/auth/refresh  →  SnakeCaseLower → { refresh_token }
    refreshToken: (refreshToken: string) =>
        api.post<ApiResponse<{ access_token: string }>>("/auth/refresh", {
            refresh_token: refreshToken,
        }),

    // POST /v1/auth/logout  →  SnakeCaseLower → { refresh_token }
    logout: (refreshToken: string) =>
        api.post<ApiResponse<void>>("/auth/logout", {
            refresh_token: refreshToken,
        }),
};