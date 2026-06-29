import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTheme} from '@/theme/ThemeProvider';
import {ProfileScreen} from '@/screens/delivery/ProfileScreen';
import {SettingsScreen} from '@/screens/delivery/SettingsScreen';
import type {ProfileStackParamList} from '@/types/navigation.types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack: React.FC = () => {
  const {colors} = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.background},
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};
