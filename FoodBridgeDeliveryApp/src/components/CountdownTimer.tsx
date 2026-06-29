import React, {useEffect, useState} from 'react';
import {Text, TouchableOpacity} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';

interface CountdownTimerProps {
  initialSeconds?: number;
  onResend: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialSeconds = 30,
  onResend,
}) => {
  const {colors, spacing} = useTheme();
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining]);

  const handleResend = () => {
    setRemaining(initialSeconds);
    onResend();
  };

  if (remaining > 0) {
    return (
      <Text
        style={{
          fontSize: 13,
          color: colors.textSecondary,
          textAlign: 'center',
        }}>
        Resend OTP in{' '}
        <Text style={{fontWeight: '700', color: colors.primary}}>
          {remaining}s
        </Text>
      </Text>
    );
  }

  return (
    <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: colors.primary,
          textAlign: 'center',
        }}>
        Resend OTP
      </Text>
    </TouchableOpacity>
  );
};
