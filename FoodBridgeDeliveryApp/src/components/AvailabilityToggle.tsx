import React from 'react';
import {View, Text, Switch, ActivityIndicator} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';
import {useAvailability} from '@/hooks/useAvailability';
import {Card} from '@/components/ui/Card';

export const AvailabilityToggle: React.FC = () => {
  const {colors, spacing} = useTheme();
  const {isOnline, isLoading, toggle} = useAvailability();

  return (
    <Card>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{flex: 1}}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: colors.textPrimary,
            }}>
            {isOnline ? 'You\'re Online' : 'You\'re Offline'}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              marginTop: spacing.xxs,
            }}>
            {isOnline
              ? 'You\'ll receive new delivery offers'
              : 'Turn on to start receiving offers'}
          </Text>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Switch
            value={isOnline}
            onValueChange={toggle}
            trackColor={{
              false: colors.border,
              true: colors.successLight,
            }}
            thumbColor={isOnline ? colors.success : colors.textDisabled}
          />
        )}
      </View>
    </Card>
  );
};
