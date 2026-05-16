import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  StatusBar,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { verifyOTP } from '../../services/auth/authService';
import { useUserStore } from '../../store/userStore';

const OTP_LENGTH = 6;
const RESEND_TIMER = 30;

export const OtpScreen = ({ route, navigation }) => {
  const { mobile_number } = route.params;
  const phone = mobile_number;
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(RESEND_TIMER);
  const [canResend, setCanResend] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const isVerifying = useRef(false);
  const inputs = useRef([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 500, useNativeDriver: true,
    }).start();
    startTimer();
    setTimeout(() => inputs.current[0]?.focus(), 300);
  }, []);

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const startTimer = () => {
    setTimer(RESEND_TIMER);
    setCanResend(false);
  };

  const handleChange = (text, index) => {
    const val = text.replace(/[^0-9]/g, '').slice(-1);
    const updated = [...otp];
    updated[index] = val;
    setOtp(updated);
    setOtpError(false);

    if (val && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (val && index === OTP_LENGTH - 1) {
      const fullOtp = [...updated].join('');
      if (fullOtp.length === OTP_LENGTH) {
        Keyboard.dismiss();
        setTimeout(() => handleVerify(fullOtp), 100);
      }
    }
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const shakeBoxes = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleVerify = async (otpString) => {
    if (isVerifying.current) return;
    isVerifying.current = true;

    const otpStr = otpString || otp.join('');
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    if (otpStr.length < OTP_LENGTH) {
      Alert.alert('Incomplete OTP', 'Please enter all 6 digits');
      isVerifying.current = false;
      return;
    }

    setLoading(true);

    // ── Step 1: Verify OTP — authService saves tokens to AsyncStorage ──
    try {
      await verifyOTP(cleanPhone, otpStr);
    } catch (error) {
      isVerifying.current = false;
      setLoading(false);
      setOtpError(true);
      setOtp(Array(OTP_LENGTH).fill(''));
      shakeBoxes();
      inputs.current[0]?.focus();
      return;
    }

    // ── Step 2: Clear any stale data from previous user ──────
    require('../../store/cartStore').useCartStore.getState().clearCart();
    require('../../store/orderStore').useOrderStore.getState().clearOrders();
    require('../../store/notificationStore').useNotificationStore.getState().clearAll();
    require('../../store/addressStore').useAddressStore.setState({
      addresses: [],
      selectedAddress: null,
    });

    // ── Step 3: Load new user into store from AsyncStorage ───
    // verifyOTP already saved access_token, refresh_token, user
    await useUserStore.getState().initUser();

    // ── Step 4: Navigate to app ──────────────────────────────
    isVerifying.current = false;
    setLoading(false);

    navigation.reset({
      index: 0,
      routes: [{ name: 'MainApp' }],
    });
  };

  const handleResend = () => {
    if (!canResend) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    setOtpError(false);
    startTimer();
    inputs.current[0]?.focus();
    Alert.alert('OTP Sent', `A new OTP has been sent to +91 ${phone}`);
  };

  const filledCount = otp.filter(d => d !== '').length;
  const progress = (filledCount / OTP_LENGTH) * 100;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.iconBox}>
          <Text style={styles.iconEmoji}>📱</Text>
        </View>

        <Text style={styles.title}>Verify your number</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit OTP to{'\n'}
          <Text style={styles.phone}>+91 {phone}</Text>
          {' '}
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </Text>

        <Animated.View style={[
          styles.otpRow,
          { transform: [{ translateX: shakeAnim }] },
        ]}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputs.current[index] = ref}
              style={[
                styles.otpBox,
                digit && styles.otpBoxFilled,
                otpError && styles.otpBoxError,
                !otpError && digit && index === filledCount - 1 && styles.otpBoxActive,
              ]}
              value={digit}
              onChangeText={text => handleChange(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              caretHidden
              contextMenuHidden
            />
          ))}
        </Animated.View>

        {otpError && (
          <Text style={styles.errorText}>❌ Incorrect OTP. Please try again.</Text>
        )}

        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{filledCount}/{OTP_LENGTH} digits entered</Text>

        <Button
          title={loading ? 'Verifying...' : 'Verify OTP ✓'}
          onPress={() => handleVerify()}
          loading={loading}
          style={styles.btn}
          disabled={filledCount < OTP_LENGTH}
        />

        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't receive OTP?  </Text>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>Resend in <Text style={styles.timerBold}>{timer}s</Text></Text>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },

  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconEmoji: { fontSize: 36 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 16 },
  phone: { fontWeight: '700', color: Colors.textPrimary },
  changeText: { fontSize: 13, color: Colors.primary, fontWeight: '600', textDecorationLine: 'underline' },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  otpBox: {
    width: 48,
    height: 58,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 14,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  otpBoxActive: {
    borderColor: Colors.primaryDark,
    backgroundColor: Colors.primaryLight,
  },
  otpBoxError: {
    borderColor: Colors.error,
    backgroundColor: '#FFF0F0',
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '500',
    marginBottom: 8,
  },

  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 24,
  },

  btn: { marginBottom: 20 },

  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendLabel: { fontSize: 14, color: Colors.textSecondary },
  resendLink: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  timerText: { fontSize: 14, color: Colors.textSecondary },
  timerBold: { color: Colors.primary, fontWeight: '700' },
});