import 'react-native-url-polyfill/auto';
import React from 'react';
import './src/api/interceptor';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ThemeProvider} from '@/theme/ThemeProvider';
import {RootNavigator} from '@/navigation/RootNavigator';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
