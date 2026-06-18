import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/common/Button';
import { sendOTP } from "../../services/auth/authService";
import { validatePhone } from '../../utils/validators';

import { useUserStore } from "../../store/userStore";

const { height } = Dimensions.get('window');

export const LoginScreen = ({ navigation }) => {
  const Colors = useTheme();
  const darkMode = useUserStore(s => s.darkMode);
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputBorderAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(inputBorderAnim, {
      toValue: 1, duration: 200, useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(inputBorderAnim, {
      toValue: 0, duration: 200, useNativeDriver: false,
    }).start();
  };

  const shakeInput = () => {
    shakeAnim.setValue(0);

    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: false }),
    ]).start();
  };

  const handleSendOTP = async () => {
    if (!validatePhone(phone)) {
      shakeInput();
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      const res = await sendOTP(cleanPhone);
      navigation.navigate("OtpScreen", {
        mobile_number: cleanPhone,
      });
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const borderColor = inputBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.primary],
  });

  const isComplete = phone.length === 10;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar backgroundColor={Colors.surface} barStyle={darkMode ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Top Illustration */}
          <Animated.View style={[
            styles.illustrationBox,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}>
            <View style={styles.illustrationCircle}>
              <Text style={styles.illustrationEmoji}>🛵</Text>
            </View>
            <View style={[styles.floatingBadge, styles.badge1]}>
              <Text style={styles.badgeText}>⚡ Fast</Text>
            </View>
            <View style={[styles.floatingBadge, styles.badge2]}>
              <Text style={styles.badgeText}>🍔 Fresh</Text>
            </View>
            <View style={[styles.floatingBadge, styles.badge3]}>
              <Text style={styles.badgeText}>💯 Quality</Text>
            </View>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[
            styles.formBox,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}>
            <Text style={styles.title}>Welcome back! 👋</Text>
            <Text style={styles.subtitle}>
              Enter your phone number to order delicious food
            </Text>

            {/* Phone Input */}
            <Text style={styles.label}>Mobile Number</Text>
            <Animated.View style={[
              styles.phoneInputWrapper,
              { borderColor },
              { transform: [{ translateX: shakeAnim }] },
            ]}>
              <View style={styles.prefixBox}>
                <Text style={styles.flag}>🇮🇳</Text>
                <Text style={styles.prefixText}>+91</Text>
              </View>
              <View style={styles.dividerLine} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="9876543210"
                placeholderTextColor={Colors.textLight}
                keyboardType="phone-pad"
                maxLength={10}
                onFocus={handleFocus}
                onBlur={handleBlur}
                returnKeyType="done"
                onSubmitEditing={handleSendOTP}
              />
              {isComplete && (
                <Text style={styles.checkmark}>✅</Text>
              )}
            </Animated.View>

            {/* Character count */}
            <Text style={styles.charCount}>{phone.length}/10</Text>

            {/* CTA Button */}
            <Button
              title="Send OTP →"
              onPress={handleSendOTP}
              loading={loading}
              style={[styles.btn, !isComplete && styles.btnDisabled]}
            />

            {/* Terms */}
            <Text style={styles.terms}>
              By continuing, you agree to our{' '}
              <Text style={styles.link}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>

            {/* Demo hint */}
            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>🧪 Demo Mode</Text>
              <Text style={styles.demoText}>
                Enter any 10-digit number → OTP: <Text style={styles.demoBold}>123456</Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 32 },

  // Illustration
  illustrationBox: {
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.28,
    backgroundColor: C.primaryLight,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationEmoji: { fontSize: 56 },
  floatingBadge: {
    position: 'absolute',
    backgroundColor: C.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 4,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  badge1: { top: 20, left: 24 },
  badge2: { top: 20, right: 24 },
  badge3: { bottom: 20, right: '30%' },
  badgeText: { fontSize: 12, fontWeight: '600', color: C.textPrimary },

  // Form
  formBox: { paddingHorizontal: 24, paddingTop: 24 },
  title: { fontSize: 26, fontWeight: '800', color: C.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: C.textSecondary, lineHeight: 21, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 8 },

  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: C.surface,
  },
  prefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: C.background,
    gap: 6,
  },
  flag: { fontSize: 18 },
  prefixText: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  dividerLine: { width: 1, height: '60%', backgroundColor: C.border },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 17,
    color: C.textPrimary,
    letterSpacing: 1,
  },
  checkmark: { paddingRight: 12, fontSize: 18 },
  charCount: {
    textAlign: 'right',
    fontSize: 11,
    color: C.textLight,
    marginTop: 4,
    marginBottom: 20,
  },

  btn: { marginBottom: 16 },
  btnDisabled: { opacity: 0.65 },

  terms: {
    fontSize: 12,
    color: C.textLight,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  link: { color: C.primary, fontWeight: '500' },

  demoBox: {
    backgroundColor: C.primaryLight,
    borderWidth: 1,
    borderColor: C.primaryLight,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  demoTitle: { fontSize: 13, fontWeight: '700', color: C.primary, marginBottom: 4 },
  demoText: { fontSize: 12, color: C.textSecondary, textAlign: 'center' },
  demoBold: { fontWeight: '700', color: C.textPrimary },
});
