import React from 'react';
import {View, type ViewStyle} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';

interface TabIconProps {
  focused: boolean;
  icon: React.ReactNode;
  size?: number;
  style?: ViewStyle;
}

export const TabIcon: React.FC<TabIconProps> = ({
  focused,
  icon,
  size = 24,
  style,
}) => {
  const {colors} = useTheme();

  return (
    <View
      style={[
        {
          width: size + 8,
          height: size + 8,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      {icon}
      {focused && (
        <View
          style={{
            position: 'absolute',
            bottom: -2,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.primary,
          }}
        />
      )}
    </View>
  );
};
