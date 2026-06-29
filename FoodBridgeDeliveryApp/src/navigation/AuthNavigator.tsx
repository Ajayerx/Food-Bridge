import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTheme} from '@/theme/ThemeProvider';
import {RegistrationScreen} from '@/screens/auth/RegistrationScreen';
import {AwaitingApprovalScreen} from '@/screens/auth/AwaitingApprovalScreen';
import {LoginScreen} from '@/screens/auth/LoginScreen';
import {OtpVerificationScreen} from '@/screens/auth/OtpVerificationScreen';
import type {AuthStackParamList} from '@/types/navigation.types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  const {colors, typography} = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.background},
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registration" component={RegistrationScreen} />
      <Stack.Screen
        name="AwaitingApproval"
        component={AwaitingApprovalScreen}
      />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
    </Stack.Navigator>
  );
};
