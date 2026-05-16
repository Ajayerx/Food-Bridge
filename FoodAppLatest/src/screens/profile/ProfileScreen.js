import React, { useRef } from 'react';
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
import { Colors } from '../../constants/colors';
import { Divider } from '../../components/common/Divider';
import { useUserStore } from '../../store/userStore';
import { useOrderStore } from '../../store/orderStore';
import { useCartStore } from '../../store/cartStore';

const MENU_SECTIONS = [
  {
    title: 'Account',
    items: [
      { id: 'addresses', icon: 'location-on', label: 'Saved Addresses', badge: null, screen: 'AddressesScreen' },
      { id: 'payments', icon: 'credit-card', label: 'Payment Methods', badge: null, screen: 'PaymentMethods' },
      { id: 'wallet', icon: 'account-balance-wallet', label: 'Wallet & Rewards', badge: '₹50', screen: 'WalletScreen' },
    ],
  },
  {
    title: 'Orders',
    items: [
      { id: 'orders', icon: 'receipt-long', label: 'My Orders', badge: null, screen: 'OrdersScreen' },
      { id: 'favourites', icon: 'favorite', label: 'Favourite Places', badge: null, screen: 'FavouritesScreen' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { id: 'notifs', icon: 'notifications', label: 'Notifications', badge: null, screen: null, toggle: true },
      { id: 'language', icon: 'language', label: 'Language', badge: 'EN', screen: 'LanguageScreen' },
      { id: 'theme', icon: 'dark-mode', label: 'Dark Mode', badge: null, screen: null, toggle: true },
    ],
  },
  {
    title: 'Support',
    items: [
      { id: 'help', icon: 'help-outline', label: 'Help & Support', badge: null, screen: 'HelpScreen' },
      { id: 'about', icon: 'info-outline', label: 'About App', badge: 'v1.0', screen: 'AboutScreen' },
      { id: 'rate', icon: 'star-outline', label: 'Rate Us', badge: null, screen: null },
    ],
  },
];

const StatsCard = ({ label, value, icon, color }) => (
  <View style={[styles.statsCard, { borderTopColor: color }]}>
    <Icon name={icon} size={22} color={color} />
    <Text style={styles.statsValue}>{value}</Text>
    <Text style={styles.statsLabel}>{label}</Text>
  </View>
);

const MenuRow = ({ item, onPress, toggleValue, onToggle }) => (
  <TouchableOpacity
    style={styles.menuRow}
    onPress={item.toggle ? undefined : onPress}
    activeOpacity={item.toggle ? 1 : 0.7}>
    <View style={styles.menuIconBox}>
      <Icon name={item.icon} size={20} color={Colors.primary} />
    </View>
    <Text style={styles.menuLabel}>{item.label}</Text>
    <View style={styles.menuRight}>
      {item.badge && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{item.badge}</Text>
        </View>
      )}
      {item.toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: Colors.border, true: Colors.primaryLight }}
          thumbColor={toggleValue ? Colors.primary : Colors.textLight}
          ios_backgroundColor={Colors.border}
        />
      ) : (
        <Icon name="chevron-right" size={20} color={Colors.textLight} />
      )}
    </View>
  </TouchableOpacity>
);

export const ProfileScreen = ({ navigation }) => {
  const user = useUserStore(s => s.user);
  const logout = useUserStore(s => s.logout);
  const orders = useOrderStore(s => s.orders);
  const clearCart = useCartStore(s => s.clearCart);

  const [notifEnabled, setNotifEnabled] = React.useState(true);
  const darkMode = useUserStore(s => s.darkMode);
  const toggleDarkMode = useUserStore(s => s.toggleDarkMode);

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerScale = scrollY.interpolate({
    inputRange: [-60, 0], outputRange: [1.1, 1], extrapolate: 'clamp',
  });
  const avatarScale = scrollY.interpolate({
    inputRange: [0, 80], outputRange: [1, 0.75], extrapolate: 'clamp',
  });
  const avatarOpacity = scrollY.interpolate({
    inputRange: [0, 80], outputRange: [1, 0.6], extrapolate: 'clamp',
  });

  const totalOrders = orders?.length ?? 0;
  const totalSpent = orders
    ?.filter(o => o.status === 'Delivered')
    .reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0;

  const toggleHandlers = {
    notifs: [notifEnabled, setNotifEnabled],
    theme: [darkMode, toggleDarkMode],         // ✅ connected to store
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: () => {
          clearCart();
          logout();
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

  // 👇 ADD THIS
  console.log("👤 user avatar_url:", user?.avatar_url);


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      <Animated.View style={[styles.header, { transform: [{ scale: headerScale }] }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfileScreen')}>
            <Icon name="edit" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.avatarWrapper, { transform: [{ scale: avatarScale }], opacity: avatarOpacity }]}>
          {/* ✅ FIXED: `user.avatar` → `user.profile_picture_url` */}
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.avatar}
              onError={(e) => console.log("❌ Image load error:", e.nativeEvent.error)}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.avatarOnline} />
        </Animated.View>

        <Text style={styles.userName}>{user?.full_name ?? 'Guest User'}</Text>
        <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
        {/* ✅ FIXED: `user.phone` → `user.mobile_number` */}
        <Text style={styles.userPhone}>{user?.mobile_number ?? ''}</Text>

      </Animated.View>

      <View style={styles.statsRow}>
        <StatsCard label="Orders" value={totalOrders} icon="receipt-long" color={Colors.primary} />
        <View style={styles.statsCardDivider} />
        <StatsCard label="Spent" value={`₹${totalSpent.toFixed(2)}`} icon="payments" color="#9B59B6" />
        <View style={styles.statsCardDivider} />
        <StatsCard label="Saved" value="₹120" icon="savings" color={Colors.success} />
        <View style={styles.statsCardDivider} />
        <StatsCard label="Favourites" value={0} icon="favorite" color={Colors.error} />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}>

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
                    />
                    {i < section.items.length - 1 && <Divider style={styles.menuDivider} />}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.versionRow}>
          <Text style={styles.versionText}>🍽️ FoodApp v1.0.0</Text>
          <Text style={styles.versionSub}>Made with ❤️ in India</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Icon name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomPad} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingTop: 8, paddingBottom: 20,
    paddingHorizontal: 20, alignItems: 'center',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    elevation: 6, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  editBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: Colors.white },
  avatarFallback: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 3, borderColor: Colors.white,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontSize: 32, fontWeight: '900', color: Colors.white },
  avatarOnline: {
    position: 'absolute', bottom: 4, right: 4, width: 16, height: 16,
    borderRadius: 8, backgroundColor: Colors.success, borderWidth: 2.5, borderColor: Colors.primary,
  },
  userName: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 3 },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  userPhone: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  memberBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12,
    paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  memberText: { fontSize: 12, fontWeight: '700', color: '#F39C12' },
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.white, marginHorizontal: 16,
    marginTop: 0, borderRadius: 18, elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
    paddingVertical: 0, overflow: 'hidden',
  },
  statsCard: { flex: 1, alignItems: 'center', gap: 4, paddingBottom: 4, borderTopWidth: 3, paddingTop: 12 },
  statsCardDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  statsValue: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  statsLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  scrollContent: { paddingTop: 20, paddingHorizontal: 16, paddingBottom: 32 },
  menuSection: { marginBottom: 16 },
  menuSectionTitle: {
    fontSize: 12, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4,
  },
  menuCard: { backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  menuIconBox: { width: 38, height: 38, borderRadius: 11, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  menuBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  menuDivider: { marginHorizontal: 16 },
  versionRow: { alignItems: 'center', paddingVertical: 16, gap: 4 },
  versionText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  versionSub: { fontSize: 12, color: Colors.textLight },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FFF0F0', paddingVertical: 16, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#FFCCCC', marginBottom: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.error },
  bottomPad: { height: 20 },
});