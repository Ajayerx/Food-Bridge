import React, {useState} from 'react';
import {View, Text, TextInput, Alert} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/theme/ThemeProvider';
import {Button} from '@/components/ui/Button';
import {supportApi} from '@/api/support.api';
import {useAuthStore} from '@/stores/auth.store';

export const SuspendedScreen: React.FC = () => {
  const {colors, spacing, typography} = useTheme();
  const insets = useSafeAreaInsets();
  const logout = useAuthStore(s => s.logout);
  const [appealText, setAppealText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitAppeal = async () => {
    if (!appealText.trim()) {
      return;
    }
    setIsSubmitting(true);
    try {
      await supportApi.createTicket(
        'Appeal - Suspension Review',
        appealText.trim(),
      );
      setSubmitted(true);
    } catch {
      Alert.alert('Error', 'Failed to submit appeal. Please try again.');
    } finally {
      setIsSubmitting(false);
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
      <View style={{alignItems: 'center', marginBottom: spacing.xxxl}}>
        <Text style={{fontSize: 48, marginBottom: spacing.lg}}>⚠️</Text>
        <Text
          style={[
            typography.h1,
            {color: colors.textPrimary, marginBottom: spacing.sm, textAlign: 'center'},
          ]}>
          Account Suspended
        </Text>
        <Text
          style={[
            typography.body,
            {color: colors.textSecondary, textAlign: 'center', lineHeight: 22},
          ]}>
          Your account has been suspended. Submit an appeal below to request
          reinstatement.
        </Text>
      </View>

      {submitted ? (
        <View
          style={{
            backgroundColor: colors.surfaceVariant,
            padding: spacing.lg,
            borderRadius: 12,
          }}>
          <Text
            style={[
              typography.body,
              {color: colors.textPrimary, textAlign: 'center', fontWeight: '600'},
            ]}>
            Appeal submitted successfully
          </Text>
          <Text
            style={[
              typography.labelSmall,
              {color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm},
            ]}>
            Our support team will review your appeal and get back to you.
          </Text>
        </View>
      ) : (
        <>
          <TextInput
            style={{
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              borderRadius: 8,
              padding: spacing.md,
              fontSize: 15,
              minHeight: 120,
              textAlignVertical: 'top',
              borderWidth: 1,
              borderColor: colors.borderLight,
              marginBottom: spacing.lg,
            }}
            placeholder="Explain why your account should be reinstated..."
            placeholderTextColor={colors.textDisabled}
            multiline
            value={appealText}
            onChangeText={setAppealText}
            editable={!isSubmitting}
          />

          <Button
            title={isSubmitting ? 'Submitting...' : 'Submit Appeal'}
            onPress={handleSubmitAppeal}
            loading={isSubmitting}
            disabled={!appealText.trim() || isSubmitting}
            size="lg"
            style={{marginBottom: spacing.md}}
          />
        </>
      )}

      <Button
        title="Logout"
        onPress={logout}
        variant="ghost"
        size="lg"
      />
    </View>
  );
};
