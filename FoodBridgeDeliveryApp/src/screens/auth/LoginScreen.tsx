import React, {useState} from 'react';
import {View, Text} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/theme/ThemeProvider';
import {Button} from '@/components/ui/Button';
import {TextInput} from '@/components/ui/TextInput';
import {useAuth} from '@/hooks/useAuth';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '@/types/navigation.types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({navigation}) => {
  const {colors, spacing, typography} = useTheme();
  const insets = useSafeAreaInsets();
  const {requestOtp, isLoading, error, clearError} = useAuth();

  const [mobileNumber, setMobileNumber] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleRequestOtp = async () => {
    clearError();
    setValidationError('');

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setValidationError('Enter a valid 10-digit mobile number');
      return;
    }

    try {
      await requestOtp(mobileNumber);
      navigation.navigate('OtpVerification', {mobileNumber});
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
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: colors.primaryLight + '30',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
          }}>
          <Text style={{fontSize: 24}}>🛵</Text>
        </View>
        <Text
          style={[
            typography.h1,
            {color: colors.textPrimary, marginBottom: spacing.sm},
          ]}>
          Delivery Agent Login
        </Text>
        <Text style={[typography.body, {color: colors.textSecondary}]}>
          Enter your mobile number to receive a one-time password.
        </Text>
      </View>

      {/* Form */}
      <TextInput
        label="Mobile Number"
        value={mobileNumber}
        onChangeText={text => {
          setMobileNumber(text);
          setValidationError('');
        }}
        placeholder="e.g. 9876543210"
        keyboardType="phone-pad"
        maxLength={10}
        error={validationError}
        containerStyle={{marginBottom: spacing.xxl}}
      />

      {error && (
        <View
          style={{
            backgroundColor: colors.errorLight,
            padding: spacing.md,
            borderRadius: 8,
            marginBottom: spacing.lg,
          }}>
          <Text style={{fontSize: 13, color: colors.error}}>{error}</Text>
        </View>
      )}

      <Button
        title="Send OTP"
        onPress={handleRequestOtp}
        loading={isLoading}
        size="lg"
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: spacing.xxl,
          gap: spacing.xs,
        }}>
        <Text style={{fontSize: 14, color: colors.textSecondary}}>
          New delivery agent?
        </Text>
        <Text
          style={{fontSize: 14, fontWeight: '700', color: colors.primary}}
          onPress={() => navigation.navigate('Registration')}>
          Register here
        </Text>
      </View>
    </View>
  );
};
