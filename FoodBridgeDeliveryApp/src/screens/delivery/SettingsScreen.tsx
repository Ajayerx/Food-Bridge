import React from 'react';
import {View, Text, ScrollView, Alert} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/theme/ThemeProvider';
import {Card} from '@/components/ui/Card';
import {MenuItem} from '@/components/MenuItem';
import {Button} from '@/components/ui/Button';
import {useThemeStore} from '@/stores/theme.store';
import {useAuthStore} from '@/stores/auth.store';
import {useAgentStore} from '@/stores/agent.store';
import {disconnectSignalR} from '@/services/signalr.service';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({navigation}) => {
  const {colors, spacing} = useTheme();
  const insets = useSafeAreaInsets();
  const isDarkMode = useThemeStore(s => s.isDarkMode) ?? false;
  const toggleTheme = useThemeStore(s => s.toggleTheme);
  const logout = useAuthStore(s => s.logout);
  const resetAgent = useAgentStore(s => s.reset);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will stop receiving delivery offers.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await disconnectSignalR();
            resetAgent();
            logout();
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: colors.background}}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingBottom: insets.bottom + spacing.xxl,
      }}>
      <View style={{paddingHorizontal: spacing.lg, marginBottom: spacing.xl}}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: colors.textPrimary,
          }}>
          Settings
        </Text>
      </View>

      <Card padded={false} style={{marginHorizontal: spacing.lg}}>
        <MenuItem
          icon={<Text style={{fontSize: 18}}>🌙</Text>}
          label="Dark Mode"
          toggle={{
            value: isDarkMode,
            onToggle: toggleTheme,
          }}
          showArrow={false}
        />
        <View
          style={{
            height: 1,
            backgroundColor: colors.borderLight,
            marginLeft: 56,
          }}
        />
        <MenuItem
          icon={<Text style={{fontSize: 18}}>🔔</Text>}
          label="Notifications"
          toggle={{
            value: true,
            onToggle: () => {},
          }}
          showArrow={false}
        />
      </Card>

      <View style={{paddingHorizontal: spacing.lg, marginTop: spacing.xxl}}>
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          size="lg"
        />
      </View>

      <Text
        style={{
          fontSize: 12,
          color: colors.textDisabled,
          textAlign: 'center',
          marginTop: spacing.xl,
        }}>
        FoodBridge Delivery v1.0.0
      </Text>
    </ScrollView>
  );
};
