import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useUserStore } from '../../store/userStore';

const { width, height } = Dimensions.get('window');

export const SplashScreen = ({ navigation }) => {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { isLoading, isLoggedIn, initUser } = useUserStore();

  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const bgScale = useRef(new Animated.Value(1.2)).current;

  // Dot bounce animation refs
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initUser();
    startAnimations();
  }, []);

  useEffect(() => {
    if (!isLoading && navigation) {
      setTimeout(() => {
        navigation.replace(isLoggedIn ? 'MainApp' : 'LoginScreen');
      }, 1200);
    }
  }, [isLoading, isLoggedIn]);

  const startAnimations = () => {
    // Background zoom in
    Animated.timing(bgScale, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Logo pop in
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Title slide up
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Tagline fade in
    Animated.sequence([
      Animated.delay(800),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Loading dots
    Animated.sequence([
      Animated.delay(900),
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => startDotsBounce());
  };

  const startDotsBounce = () => {
    const bounce = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -8, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      ).start();

    bounce(dot1, 0);
    bounce(dot2, 150);
    bounce(dot3, 300);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* Background circles */}
      <Animated.View style={[styles.bgCircle1, { transform: [{ scale: bgScale }] }]} />
      <Animated.View style={[styles.bgCircle2, { transform: [{ scale: bgScale }] }]} />

      {/* Logo */}
      <Animated.View style={[
        styles.logoContainer,
        {
          transform: [{ scale: logoScale }],
          opacity: logoOpacity,
        }
      ]}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>🍔</Text>
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.Text style={[
        styles.title,
        {
          opacity: titleOpacity,
          transform: [{ translateY: titleTranslateY }],
        }
      ]}>
        FoodApp
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Delicious food, delivered fast 🚀
      </Animated.Text>

      {/* Loading Dots */}
      <Animated.View style={[styles.dotsContainer, { opacity: dotsOpacity }]}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </Animated.View>

      {/* Bottom tagline */}
      <Animated.Text style={[styles.bottomText, { opacity: taglineOpacity }]}>
        From your favourite restaurants
      </Animated.Text>
    </View>
  );
};

const createStyles = (C) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgCircle1: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -width * 0.3,
    right: -width * 0.2,
  },
  bgCircle2: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -width * 0.1,
    left: -width * 0.2,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoBox: {
    width: 110,
    height: 110,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoEmoji: {
    fontSize: 60,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: C.white,
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '400',
    marginBottom: 48,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  bottomText: {
    position: 'absolute',
    bottom: 48,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
});
