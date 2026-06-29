import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';
import {DashboardScreen} from '@/screens/delivery/DashboardScreen';
import {TaskListScreen} from '@/screens/delivery/TaskListScreen';
import {ProfileStack} from './ProfileStack';
import type {MainTabParamList} from '@/types/navigation.types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator: React.FC = () => {
  const {colors} = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          paddingTop: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({focused, color}) => (
            <Text style={{fontSize: 22, color}}>
              {focused ? '🏠' : '🏡'}
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TaskListScreen}
        options={{
          tabBarLabel: 'Tasks',
          tabBarIcon: ({focused, color}) => (
            <Text style={{fontSize: 22, color}}>
              {focused ? '📋' : '📄'}
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({focused, color}) => (
            <Text style={{fontSize: 22, color}}>
              {focused ? '👤' : '👥'}
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};
