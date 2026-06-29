import React from 'react';
import {View, type ViewStyle} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padded = true,
}) => {
  const {colors, borderRadius: br, spacing} = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: br.lg,
          borderWidth: 1,
          borderColor: colors.borderLight,
          padding: padded ? spacing.lg : 0,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 1},
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        },
        style,
      ]}>
      {children}
    </View>
  );
};
