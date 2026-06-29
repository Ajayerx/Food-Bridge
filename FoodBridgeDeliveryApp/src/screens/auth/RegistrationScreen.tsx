import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/theme/ThemeProvider';
import {Button} from '@/components/ui/Button';
import {TextInput} from '@/components/ui/TextInput';
import {useAuth} from '@/hooks/useAuth';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '@/types/navigation.types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Registration'>;

const VEHICLE_TYPES = ['Bicycle', 'Motorcycle', 'Scooter', 'Car', 'Van', 'OnFoot'] as const;

export const RegistrationScreen: React.FC<Props> = ({navigation}) => {
  const {colors, spacing, typography} = useTheme();
  const insets = useSafeAreaInsets();
  const {register, isLoading, error, clearError} = useAuth();

  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      newErrors.mobileNumber = 'Enter a valid 10-digit mobile number';
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('[Registration] handleSubmit called');
    clearError();
    if (!validate()) {
      console.log('[Registration] validation failed, returning early');
      return;
    }
    console.log('[Registration] validation passed, calling register');

    try {
      await register({
        mobileNumber,
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        vehicleType: vehicleType || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
      });
      navigation.navigate('AwaitingApproval');
    } catch {
      // Error is set in hook
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{flex: 1, backgroundColor: colors.background}}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.xxxl,
          paddingBottom: insets.bottom + spacing.xxl,
          paddingHorizontal: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={{marginBottom: spacing.xxxl}}>
          <Text
            style={[
              typography.h1,
              {color: colors.textPrimary, marginBottom: spacing.sm},
            ]}>
            Become a Delivery Agent
          </Text>
          <Text
            style={[
              typography.body,
              {color: colors.textSecondary, lineHeight: 22},
            ]}>
            Join FoodBridge and start earning by delivering food in your area.
          </Text>
        </View>

        {/* Form */}
        <View style={{gap: spacing.lg}}>
          <TextInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. Raj Kumar"
            error={errors.fullName}
          />

          <TextInput
            label="Mobile Number"
            value={mobileNumber}
            onChangeText={setMobileNumber}
            placeholder="e.g. 9876543210"
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.mobileNumber}
          />

          <TextInput
            label="Email (optional)"
            value={email}
            onChangeText={setEmail}
            placeholder="e.g. raj@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.textSecondary,
                marginBottom: spacing.xs,
              }}>
              Vehicle Type (optional)
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.sm,
              }}>
              {VEHICLE_TYPES.map(vt => {
                const selected = vehicleType === vt;
                return (
                  <View
                    key={vt}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    <View
                      style={{
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                        borderRadius: 8,
                        backgroundColor: selected
                          ? colors.primary
                          : colors.surfaceVariant,
                        borderWidth: 1,
                        borderColor: selected
                          ? colors.primary
                          : colors.border,
                      }}>
                      <Text
                        onPress={() => setVehicleType(selected ? '' : vt)}
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: selected ? colors.white : colors.textPrimary,
                        }}>
                        {vt}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <TextInput
            label="Vehicle Number (optional)"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            placeholder="e.g. MH12AB1234"
            autoCapitalize="characters"
          />

          <TextInput
            label="License Number (optional)"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            placeholder="e.g. DL-1420110012345"
            autoCapitalize="characters"
          />
        </View>

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
          title="Submit for Review"
          onPress={handleSubmit}
          loading={isLoading}
          size="lg"
          style={{marginTop: spacing.xxl}}
        />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: spacing.lg,
            gap: spacing.xs,
          }}>
          <Text style={{fontSize: 14, color: colors.textSecondary}}>
            Already have an account?
          </Text>
          <Text
            style={{fontSize: 14, fontWeight: '700', color: colors.primary}}
            onPress={() => navigation.navigate('Login')}>
            Log in
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
