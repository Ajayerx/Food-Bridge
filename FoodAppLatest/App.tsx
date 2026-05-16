import 'react-native-url-polyfill/auto';
import React, {useEffect} from 'react';
import {StatusBar, LogBox} from 'react-native';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import RootNavigator from './src/navigation/RootNavigator';
import {useUserStore} from './src/store/userStore';
import {Colors, DarkColors} from './src/constants/colors';
import './src/services/api/interceptor';
import {useNotifications} from './src/hooks/useNotifications';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 300000,
      refetchOnWindowFocus: false,
    },
  },
});

// ✅ Custom nav themes matching our color palette
const LightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.white,
    text: Colors.textPrimary,
    border: Colors.border,
  },
};

const DarkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: DarkColors.background,
    card: DarkColors.white,
    text: DarkColors.textPrimary,
    border: DarkColors.border,
  },
};

// ✅ Separate component so useUserStore works inside QueryClientProvider
function AppContent() {
  const initUser = useUserStore(s => s.initUser);
  const user = useUserStore(s => s.user); // ← add this
  const darkMode = useUserStore(s => s.darkMode);
  const theme = darkMode ? DarkNavTheme : LightNavTheme;
  const C = darkMode ? DarkColors : Colors;

  // ✅ Initialize notifications at root level so badge count works everywhere
  useNotifications(user?.user_id); // ← add this

  useEffect(() => {
    initUser();
  }, []);

  return (
    <>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={C.white}
      />
      <NavigationContainer theme={theme}>
        <RootNavigator />
      </NavigationContainer>
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
