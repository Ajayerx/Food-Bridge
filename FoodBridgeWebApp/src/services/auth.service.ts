import api from "../lib/apiClient";
import type { ApiLoginResponse, ApiResponse } from 'types';

// Schema: OtpRequestDto          { mobile_number }
// Schema: OtpVerifyDto           { mobile_number, otp, device_info? }
// Schema: RefreshRequestDto      { refresh_token }

export const authService = {
    // POST /v1/auth/request-otp  →  OtpRequestDto
    requestOtp: (mobileNumber: string) =>
        api.post("/auth/request-otp", { mobileNumber: mobileNumber }),

    // POST /v1/auth/verify-otp  →  OtpVerifyDto
    verifyOtp: (mobileNumber: string, otp: string, deviceInfo?: string) =>
        api.post("/auth/verify-otp", {
            mobilenumber: mobileNumber,
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