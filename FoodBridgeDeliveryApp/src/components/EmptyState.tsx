import React from 'react';
import {View, Text} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
}) => {
  const {colors, spacing} = useTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.huge,
        paddingHorizontal: spacing.xl,
      }}>
      <Text style={{fontSize: 48, marginBottom: spacing.lg}}>{icon}</Text>
      <Text
        style={{
          fontSize: 17,
          fontWeight: '600',
          color: colors.textPrimary,
          textAlign: 'center',
        }}>
        {title}
      </Text>
      {description && (
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: spacing.sm,
            lineHeight: 20,
          }}>
          {description}
        </Text>
      )}
    </View>
  );
};
