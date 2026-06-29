import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTheme} from '@/theme/ThemeProvider';
import {useAuthStore} from '@/stores/auth.store';
import {useSignalR} from '@/hooks/useSignalR';
import {useStatusMonitor} from '@/hooks/useStatusMonitor';
import {AuthNavigator} from './AuthNavigator';
import {MainNavigator} from './MainNavigator';
import {SuspendedScreen} from '@/screens/auth/SuspendedScreen';
import {RejectedScreen} from '@/screens/auth/RejectedScreen';
import {BannedScreen} from '@/screens/auth/BannedScreen';
import {AwaitingApprovalScreen} from '@/screens/auth/AwaitingApprovalScreen';
import {OfferModal} from '@/components/OfferModal';
import type {RootStackParamList} from '@/types/navigation.types';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const {colors} = useTheme();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const status = useAuthStore(s => s.status);

  // Connect SignalR when authenticated
  useSignalR();

  // Periodically check agent status when active — auto-logout if suspended
  useStatusMonitor();

  const renderRoot = () => {
    if (!isAuthenticated) {
      return <RootStack.Screen name="Auth" component={AuthNavigator} />;
    }

    switch (status) {
      case 'Active':
        return <RootStack.Screen name="Main" component={MainNavigator} />;
      case 'Inactive':
        return <RootStack.Screen name="Suspended" component={SuspendedScreen} />;
      case 'Pending':
        return <RootStack.Screen name="AwaitingApproval" component={AwaitingApprovalScreen} />;
      case 'Rejected':
        return <RootStack.Screen name="Rejected" component={RejectedScreen} />;
      case 'Banned':
        return <RootStack.Screen name="Banned" component={BannedScreen} />;
      default:
        return <RootStack.Screen name="Auth" component={AuthNavigator} />;
    }
  };

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: colors.background},
          animation: 'fade',
        }}>
        {renderRoot()}
        <RootStack.Group screenOptions={{presentation: 'modal'}}>
          <RootStack.Screen name="OfferModal" component={OfferModal} />
        </RootStack.Group>
      </RootStack.Navigator>

      {/* Global offer modal — shown when dispatch store has an active offer */}
      <OfferModal />
    </NavigationContainer>
  );
};
