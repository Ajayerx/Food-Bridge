import React, {useEffect, useRef} from 'react';
import {View, Text, Animated, Easing} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/theme/ThemeProvider';
import {Button} from '@/components/ui/Button';
import {useAuthStore} from '@/stores/auth.store';

export const AwaitingApprovalScreen: React.FC = () => {
  const logout = useAuthStore(s => s.logout);
  const {colors, spacing, typography} = useTheme();
  const insets = useSafeAreaInsets();
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}>
      {/* Animated spinner */}
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          borderWidth: 4,
          borderColor: colors.border,
          borderTopColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: spacing.xxxl,
        }}>
        <Animated.View
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 40,
            borderWidth: 4,
            borderColor: 'transparent',
            borderTopColor: colors.primary,
            position: 'absolute',
            transform: [{rotate: spin}],
          }}
        />
        <Text style={{fontSize: 28}}>⏳</Text>
      </View>

      <Text
        style={[
          typography.h2,
          {color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.md},
        ]}>
        Under Review
      </Text>

      <Text
        style={[
          typography.body,
          {
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: spacing.xxxl,
          },
        ]}>
        Your profile has been submitted successfully. Our team will review your
        application and notify you once it's approved.
      </Text>

      <View
        style={{
          backgroundColor: colors.surfaceVariant,
          padding: spacing.lg,
          borderRadius: 12,
          width: '100%',
        }}>
        <Text
          style={[
            typography.labelSmall,
            {color: colors.textSecondary, textAlign: 'center'},
          ]}>
          You'll receive a notification when your account is approved.
        </Text>
      </View>

      <Button
        title="Logout"
        onPress={logout}
        variant="ghost"
        size="lg"
        style={{marginTop: spacing.xxl}}
      />
    </View>
  );
};
