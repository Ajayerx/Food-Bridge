import React, {useRef, createRef} from 'react';
import {
  View,
  TextInput,
  type TextInput as RNTextInput,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  error?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
}) => {
  const {colors, borderRadius: br, spacing} = useTheme();
  const refs = useRef(
    Array.from({length}, () => createRef<RNTextInput>()),
  ).current;

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = value.split('');
    newOtp[index] = digit;
    const joined = newOtp.join('');

    onChange(joined);

    if (digit && index < length - 1) {
      refs[index + 1].current?.focus();
    }

    if (joined.length === length && onComplete) {
      onComplete(joined);
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.sm,
        justifyContent: 'center',
      }}>
      {Array.from({length}, (_, i) => (
        <TextInput
          key={i}
          ref={refs[i]}
          value={value[i] ?? ''}
          onChangeText={text => handleChange(text, i)}
          onKeyPress={e => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          style={{
            width: 48,
            height: 56,
            borderRadius: br.md,
            borderWidth: 2,
            borderColor: error
              ? colors.error
              : value[i]
              ? colors.primary
              : colors.border,
            backgroundColor: colors.surface,
            textAlign: 'center',
            fontSize: 22,
            fontWeight: '700',
            color: colors.textPrimary,
          }}
        />
      ))}
    </View>
  );
};
