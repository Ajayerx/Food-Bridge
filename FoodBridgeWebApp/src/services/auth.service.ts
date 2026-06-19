import api from "../lib/apiClient";
import type { ApiLoginResponse, ApiResponse } from 'types';

export const authService = {
    // POST /v1/auth/otp/request  →  { phoneNumber }
    requestOtp: (phoneNumber: string) =>
        api.post("/auth/otp/request", { phoneNumber }),

    // POST /v1/auth/otp/verify  →  { phoneNumber, otp, device_info? }
    verifyOtp: (phoneNumber: string, otp: string, deviceInfo?: string) =>
        api.post("/auth/otp/verify", {
            phoneNumber,
            otp,
            device_info: deviceInfo ?? null,
        }),

    // POST /v1/auth/refresh  →  RefreshRequestDto
    refreshToken: (refreshToken: string) =>
        api.post<ApiResponse<{ accessToken: string }>>("/auth/refresh", {
            refresh_token: refreshToken,
        }),

    // POST /v1/auth/logout  →  RefreshRequestDto
    logout: (refreshToken: string) =>
        api.post<ApiResponse<void>>("/auth/logout", {
            refresh_token: refreshToken,
        }),
};