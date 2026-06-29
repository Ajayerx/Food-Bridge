import React from 'react';
import {View, Text, Image, type ImageStyle, type ViewStyle} from 'react-native';
import {palette} from '@/theme/colors';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  style?: ViewStyle | ImageStyle;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? '')
    .join('');
}

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = palette.avatarColors;
  return colors[Math.abs(hash) % colors.length];
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 40,
  style,
}) => {
  if (imageUrl) {
    return (
      <Image
        source={{uri: imageUrl}}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style as ImageStyle,
        ]}
      />
    );
  }

  const initials = getInitials(name);
  const color = avatarColor(name);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      <Text
        style={{
          color: '#fff',
          fontSize: size * 0.38,
          fontWeight: '700',
        }}>
        {initials}
      </Text>
    </View>
  );
};
