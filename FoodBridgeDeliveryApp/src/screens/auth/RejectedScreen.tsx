import React from 'react';
import {View, Text, Linking} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/theme/ThemeProvider';
import {Button} from '@/components/ui/Button';
import {useAuthStore} from '@/stores/auth.store';

export const RejectedScreen: React.FC = () => {
  const {colors, spacing, typography} = useTheme();
  const insets = useSafeAreaInsets();
  const logout = useAuthStore(s => s.logout);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top + spacing.huge,
        paddingBottom: insets.bottom,
        paddingHorizontal: spacing.xl,
        justifyContent: 'center',
      }}>
      <View style={{alignItems: 'center', marginBottom: spacing.xxxl}}>
        <Text style={{fontSize: 48, marginBottom: spacing.lg}}>❌</Text>
        <Text
          style={[
            typography.h1,
            {color: colors.textPrimary, marginBottom: spacing.sm, textAlign: 'center'},
          ]}>
          Registration Rejected
        </Text>
        <Text
          style={[
            typography.body,
            {color: colors.textSecondary, textAlign: 'center', lineHeight: 22},
          ]}>
          Your delivery agent registration has been rejected. If you believe this
          is a mistake, please contact our support team.
        </Text>
      </View>

      <Button
        title="Contact Support"
        onPress={() => Linking.openURL('mailto:support@foodbridge.app')}
        size="lg"
        style={{marginBottom: spacing.md}}
      />

      <Button
        title="Logout"
        onPress={logout}
        variant="ghost"
        size="lg"
      />
    </View>
  );
};
