import {useState} from 'react';
import {useAuthStore} from '@/stores/auth.store';
import {authApi} from '@/api/auth.api';
import type {AgentRegistrationRequest} from '@/types/auth.types';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logout = useAuthStore(s => s.logout);
  const setAuth = useAuthStore(s => s.setAuth);

  const register = async (data: AgentRegistrationRequest) => {
    console.log('[useAuth] register called with:', JSON.stringify(data));
    setIsLoading(true);
    setError(null);
    try {
      console.log('[useAuth] calling authApi.register');
      const res = await authApi.register(data);
      console.log('[useAuth] authApi.register succeeded:', JSON.stringify(res.data));
      return res.data;
    } catch (e: any) {
      console.log('[useAuth] register caught error:', e?.message, e?.response?.data);
      const msg =
        e?.response?.data?.error?.message ??
        e?.response?.data?.message ??
        'Registration failed. Please try again.';
      console.log('[useAuth] extracted error message:', msg);
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const requestOtp = async (mobileNumber: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.login({mobileNumber});
      return res.data;
    } catch (e: any) {
      const msg =
        e?.response?.data?.error?.message ??
        e?.response?.data?.message ??
        'Failed to send OTP.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (mobileNumber: string, otp: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.verifyOtp({
        mobileNumber,
        otp,
        deviceInfo: 'mobile-app',
      });
      if (res.data?.data) {
        const d = res.data.data as Record<string, any>;
        setAuth({
          token: d.accessToken,
          refreshToken: d.refreshToken,
          expiresAt: new Date(Date.now() + (d.expiresIn || 60) * 1000).toISOString(),
          agent: {
            id: d.userId,
            fullName: d.fullName,
            mobileNumber: d.mobileNumber,
            status: d.status ?? 'Active',
          },
        });
      }
      return res.data;
    } catch (e: any) {
      const msg =
        e?.response?.data?.error?.message ??
        e?.response?.data?.message ??
        'Invalid OTP. Please try again.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return {
    isLoading,
    error,
    register,
    requestOtp,
    verifyOtp,
    logout: handleLogout,
    clearError: () => setError(null),
  };
}
