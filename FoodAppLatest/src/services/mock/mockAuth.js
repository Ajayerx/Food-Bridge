import AsyncStorage from '@react-native-async-storage/async-storage';
import userData from '../../data/user.json';

export const login = async (phone) => ({data: {phone, otpSent: true}});

export const verifyOTP = async (phone, otp) => {
  if (otp === '123456') {
    const user = {...userData.user, phone};
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return {data: {user, token: 'mock_token_xyz'}};
  }
  throw new Error('Invalid OTP. Use 123456 for demo.');
};

export const getStoredUser = async () => {
  const str = await AsyncStorage.getItem('user');
  return str ? JSON.parse(str) : null;
};

export const logout = async () => AsyncStorage.removeItem('user');
