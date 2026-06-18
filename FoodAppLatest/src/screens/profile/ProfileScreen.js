import React, { useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Alert,
  Switch,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../hooks/useTheme';
import { Divider } from '../../components/common/Divider';
import { useUserStore } from '../../store/userStore';
import { useOrderStore } from '../../store/orderStore';
import { useCartStore } from '../../store/cartStore';

const MENU_SECTIONS = [
  {
    title: 'Account',
    items: [
      { id: 'addresses', icon: 'location-on', label: 'Saved Addresses', desc: 'Manage your delivery addresses', badge: null, screen: 'AddressesScreen' },
      { id: 'payments', icon: 'credit-card', label: 'Payment Methods', desc: 'Cards, UPI & wallets', badge: null, screen: 'PaymentMethods' },
      { id: 'wallet', icon: 'account-balance-wallet', label: 'Wallet & Rewards', desc: 'Balance, coupons & cashback', badge: '₹50', screen: 'WalletScreen' },
    ],
  },
  {
    title: 'Orders',
    items: [
      { id: 'orders', icon: 'receipt-long', label: 'My Orders', desc: 'Track & manage orders', badge: null, screen: 'OrdersScreen' },
      { id: 'favourites', icon: 'favorite', label: 'Favourite Places', desc: 'Places you love', badge: null, screen: 'FavouritesScreen' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { id: 'notifs', icon: 'notifications', label: 'Notifications', desc: 'Alerts & reminders', badge: null, screen: null, toggle: true },
      { id: 'language', icon: 'language', label: 'Language', desc: 'App display language', badge: 'EN', screen: 'LanguageScreen' },
      { id: 'theme', icon: 'dark-mode', label: 'Dark Mode', desc: 'Switch appearance', badge: null, screen: null, toggle: true },
    ],
  },
  {
    title: 'Support',
    items: [
      { id: 'help', icon: 'help-outline', label: 'Help & Support', desc: 'FAQs & contact us', badge: null, screen: 'HelpScreen' },
      { id: 'about', icon: 'info-outline', label: 'About App', desc: 'Version & legal info', badge: 'v1.0', screen: 'AboutScreen' },
      { id: 'rate', icon: 'star-outline', label: 'Rate Us', desc: 'Share your feedback', badge: null, screen: null },
    ],
  },
];

/* ─── Animated Menu Row with press feedback ─── */
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const MenuRow = ({ item, onPress, toggleValue, onToggle, C, s }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  }, []);

  return (
    <AnimatedTouchableOpacity
      style={[s.menuRow, { transform: [{ scale: scaleAnim }] }]}
      onPress={item.toggle ? undefined : onPress}
      onPressIn={item.toggle ? undefined : handlePressIn}
      onPressOut={item.toggle ? undefined : handlePressOut}
      activeOpacity={item.toggle ? 1 : 0.7}>
      <View style={s.menuIconBox}>
        <Icon name={item.icon} size={20} color={C.primary} />
      </View>
      <View style={s.menuTextWrap}>
        <Text style={s.menuLabel}>{item.label}</Text>
        {item.desc ? <Text style={s.menuDesc}>{item.desc}</Text> : null}
      </View>
      <View style={s.menuRight}>
        {item.badge && (
          <View style={s.menuBadge}>
            <Text style={s.menuBadgeText}>{item.badge}</Text>
          </View>
        )}
        {item.toggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: C.border, true: C.primaryLight }}
            thumbColor={toggleValue ? C.primary : C.textLight}
            ios_backgroundColor={C.border}
          />
        ) : (
          <Icon name="chevron-right" size={20} color={C.textLight} />
        )}
      </View>
    </AnimatedTouchableOpacity>
  );
};

/* ─── Animated Logout Button ─── */
const LogoutButton = ({ onPress, C, s }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  }, []);

  return (
    <AnimatedTouchableOpacity
      style={[s.logoutBtn, { transform: [{ scale: scaleAnim }] }]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}>
      <View style={s.logoutIconWrap}>
        <Icon name="logout" size={20} color={C.error} />
      </View>
      <View style={s.logoutTextWrap}>
        <Text style={s.logoutText}>Logout</Text>
        <Text style={s.logoutDesc}>Sign out of your account</Text>
      </View>
      <Icon name="chevron-right" size={20} color="#FFCCCC" />
    </AnimatedTouchableOpacity>
  );
};

export const ProfileScreen = ({ navigation }) => {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const user = useUserStore(s => s.user);
  const logout = useUserStore(s => s.logout);
  const orders = useOrderStore(s => s.orders);
  const clearCart = useCartStore(s => s.clearCart);

  const [notifEnabled, setNotifEnabled] = React.useState(true);
  const darkMode = useUserStore(s => s.darkMode);
  const toggleDarkMode = useUserStore(s => s.toggleDarkMode);

  const scrollY = useRef(new Animated.Value(0)).current;

  /* ─── Scroll Animations ─── */
  const headerScale = scrollY.interpolate({
    inputRange: [-60, 0, 60],
    outputRange: [1.08, 1, 1],
    extrapolate: 'clamp',
  });

  const avatarScale = scrollY.interpolate({
    inputRange: [0, 60, 120],
    outputRange: [1, 0.85, 0.7],
    extrapolate: 'clamp',
  });

  const avatarOpacity = scrollY.interpolate({
    inputRange: [0, 80, 140],
    outputRange: [1, 0.7, 0.4],
    extrapolate: 'clamp',
  });

  const greetingOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const greetingTranslate = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  const contactPillsTranslate = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -8],
    extrapolate: 'clamp',
  });

  const totalOrders = orders?.length ?? 0;
  const totalSpent = orders
    ?.filter(o => o.status === 'Delivered')
    .reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0;

  const toggleHandlers = {
    notifs: [notifEnabled, setNotifEnabled],
    theme: [darkMode, toggleDarkMode],
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleMenuPress = item => {
    if (item.screen) navigation.navigate(item.screen);
    else if (item.id === 'rate') Alert.alert('Rate Us', 'Redirect to Play Store / App Store');
  };

  const initials = user?.full_name
    ?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? 'U';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      <Animated.View style={[styles.header, { transform: [{ scale: headerScale }] }]}>
        {/* Top Row: Greeting + Edit */}
        <View style={styles.headerTop}>
          <Animated.View style={{ opacity: greetingOpacity, transform: [{ translateY: greetingTranslate }] }}>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.headerTitle}>{user?.full_name ?? 'Guest User'}</Text>
          </Animated.View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfileScreen')}
            activeOpacity={0.7}>
            <Icon name="edit" size={15} color={Colors.white} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar + Contact Pills */}
        <Animated.View style={[styles.profileRow, { transform: [{ translateY: contactPillsTranslate }] }]}>
          <Animated.View style={[styles.avatarWrapper, { transform: [{ scale: avatarScale }], opacity: avatarOpacity }]}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatar}
                onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarOnline} />
          </Animated.View>

          <Animated.View style={[styles.contactPills, { transform: [{ translateY: contactPillsTranslate }] }]}>
            <View style={styles.contactPill}>
              <Icon name="email" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={styles.contactPillText} numberOfLines={1}>{user?.email ?? ''}</Text>
            </View>
            {user?.mobile_number ? (
              <View style={styles.contactPill}>
                <Icon name="phone" size={13} color="rgba(255,255,255,0.9)" />
                <Text style={styles.contactPillText}>{user.mobile_number}</Text>
              </View>
            ) : null}
          </Animated.View>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        overScrollMode="never">

        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, i) => {
                const [toggleVal, setToggleVal] = toggleHandlers[item.id] ?? [false, () => { }];
                return (
                  <React.Fragment key={item.id}>
                    <MenuRow
                      item={item}
                      onPress={() => handleMenuPress(item)}
                      toggleValue={toggleVal}
                      onToggle={val => setToggleVal(val)}
                      C={Colors} s={styles}
                    />
                    {i < section.items.length - 1 && <Divider style={styles.menuDivider} />}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        ))}

        <LogoutButton onPress={handleLogout} C={Colors} s={styles} />

        <View style={styles.versionRow}>
          <View style={styles.versionDivider} />
          <Text style={styles.versionText}>FoodApp v1.0.0</Text>
          <View style={styles.versionDivider} />
        </View>

        <View style={styles.bottomPad} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (C) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },

  /* ─── Header (flat top, rounded bottom only) ─── */
  header: {
    backgroundColor: C.primary,
    paddingTop: 16,
    paddingBottom: 30,
    paddingHorizontal: 20,
    // borderTopLeftRadius: 28,
    // borderTopRightRadius: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 6,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '400',
    marginBottom: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.white,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.white,
  },

  /* ─── Profile Row ─── */
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: C.white,
  },
  avatarFallback: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: C.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '900',
    color: C.white,
  },
  avatarOnline: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.success,
    borderWidth: 2.5,
    borderColor: C.primary,
  },

  /* ─── Contact Pills ─── */
  contactPills: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  contactPillText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    flexShrink: 1,
  },

  /* ─── Scroll Content ─── */
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  /* ─── Menu Section ─── */
  menuSection: {
    marginBottom: 18,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: C.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 15,
    color: C.textPrimary,
    fontWeight: '500',
    marginBottom: 1,
  },
  menuDesc: {
    fontSize: 11.5,
    color: C.textLight,
    fontWeight: '400',
    lineHeight: 15,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuBadge: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  menuBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
  },
  menuDivider: {
    marginHorizontal: 16,
  },

  /* ─── Logout ─── */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.errorBg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.errorBorder,
    gap: 12,
  },
  logoutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: C.errorBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutTextWrap: {
    flex: 1,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.error,
  },
  logoutDesc: {
    fontSize: 11.5,
    color: C.textLight,
    fontWeight: '400',
    marginTop: 1,
  },

  /* ─── Version ─── */
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 22,
  },
  versionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  versionText: {
    fontSize: 12,
    color: C.textLight,
    fontWeight: '500',
  },

  bottomPad: {
    height: 20,
  },
});