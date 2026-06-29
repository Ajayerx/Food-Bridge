import React, {useEffect, useRef, useState} from 'react';
import {View, Animated, Text, type ViewStyle} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';

interface OfferCountdownProps {
  expiresAt: string;
  onExpire: () => void;
  style?: ViewStyle;
}

export const OfferCountdown: React.FC<OfferCountdownProps> = ({
  expiresAt,
  onExpire,
  style,
}) => {
  const {colors, borderRadius: br, spacing} = useTheme();
  const animatedValue = useRef(new Animated.Value(1)).current;
  const [remaining, setRemaining] = useState(0);
  const hasExpired = useRef(false);

  useEffect(() => {
    const expiry = new Date(expiresAt).getTime();
    const totalMs = Math.max(0, expiry - Date.now());
    const totalSecs = Math.ceil(totalMs / 1000);
    setRemaining(totalSecs);

    if (totalMs <= 0) {
      hasExpired.current = true;
      onExpire();
      return;
    }

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
      setRemaining(diff);

      if (diff <= 0 && !hasExpired.current) {
        hasExpired.current = true;
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    Animated.timing(animatedValue, {
      toValue: 0,
      duration: totalMs,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(interval);
  }, [expiresAt, onExpire, animatedValue]);

  const barWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const barColor = animatedValue.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [colors.error, colors.warning, colors.success],
  });

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeStr =
    minutes > 0
      ? `${minutes}:${seconds.toString().padStart(2, '0')}`
      : `${seconds}s`;

  return (
    <View style={style}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
        }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.textSecondary,
          }}>
          Offer expires in
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: remaining <= 10 ? colors.error : colors.textPrimary,
          }}>
          {timeStr}
        </Text>
      </View>
      <View
        style={{
          height: 4,
          backgroundColor: colors.border,
          borderRadius: br.round,
          overflow: 'hidden',
        }}>
        <Animated.View
          style={{
            height: '100%',
            width: barWidth,
            backgroundColor: barColor as any,
            borderRadius: br.round,
          }}
        />
      </View>
    </View>
  );
};
