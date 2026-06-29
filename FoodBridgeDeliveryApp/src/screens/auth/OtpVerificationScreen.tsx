import React, {useState} from 'react';
import {View, Text, Alert} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/theme/ThemeProvider';
import {Button} from '@/components/ui/Button';
import {OtpInput} from '@/components/OtpInput';
import {CountdownTimer} from '@/components/CountdownTimer';
import {useAuth} from '@/hooks/useAuth';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '@/types/navigation.types';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>;

export const OtpVerificationScreen: React.FC<Props> = ({route, navigation}) => {
  const {mobileNumber} = route.params;
  const {colors, spacing, typography} = useTheme();
  const insets = useSafeAreaInsets();
  const {verifyOtp, requestOtp, isLoading, error, clearError} = useAuth();

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (code: string) => {
    clearError();
    setIsVerifying(true);

    try {
      await verifyOtp(mobileNumber, code);
      // Navigation handled by RootNavigator based on auth state
    } catch {
      // Error is set in hook
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    clearError();
    try {
      await requestOtp(mobileNumber);
    } catch {
      // Error is set in hook
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top + spacing.huge,
        paddingBottom: insets.bottom,
        paddingHorizontal: spacing.xl,
      }}>
      {/* Header */}
      <View style={{marginBottom: spacing.xxxl}}>
        <Text
          style={[
            typography.h1,
            {color: colors.textPrimary, marginBottom: spacing.sm},
          ]}>
          Verify OTP
        </Text>
        <Text style={[typography.body, {color: colors.textSecondary}]}>
          Enter the 6-digit code sent to{' '}
          <Text style={{fontWeight: '600', color: colors.textPrimary}}>
            {mobileNumber}
          </Text>
        </Text>
      </View>

      {/* OTP Input */}
      <View style={{marginBottom: spacing.xxl}}>
        <OtpInput
          length={6}
          value={otp}
          onChange={setOtp}
          onComplete={handleVerify}
          error={!!error}
        />
      </View>

      {/* Resend */}
      <CountdownTimer
        initialSeconds={30}
        onResend={handleResend}
      />

      {error && (
        <View
          style={{
            backgroundColor: colors.errorLight,
            padding: spacing.md,
            borderRadius: 8,
            marginTop: spacing.lg,
          }}>
          <Text style={{fontSize: 13, color: colors.error}}>{error}</Text>
        </View>
      )}

      <Button
        title={isVerifying ? 'Verifying...' : 'Verify OTP'}
        onPress={() => handleVerify(otp)}
        loading={isLoading || isVerifying}
        disabled={otp.length < 6}
        size="lg"
        style={{marginTop: spacing.xxl}}
      />

      <Text
        style={{
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          marginTop: spacing.lg,
        }}>
        Wrong number?{' '}
        <Text
          style={{fontWeight: '700', color: colors.primary}}
          onPress={() => navigation.goBack()}>
          Change
        </Text>
      </Text>
    </View>
  );
};
