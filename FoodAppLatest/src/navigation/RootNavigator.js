import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUserStore } from '../store/userStore';
import { useSocket } from '../services/socket/useSocket';

// Auth Screens
import { SplashScreen } from '../screens/auth/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';

// Main App
import { BottomTabNavigator } from './BottomTabNavigator';

// Screens
import { RestaurantDetailScreen } from '../screens/restaurant/RestaurantDetailScreen';
import { CartScreen } from '../screens/cart/CartScreen';
import { CheckoutScreen } from '../screens/checkout/CheckoutScreen';
import { CouponScreen } from '../screens/cart/CouponScreen';
import { OrderTrackingScreen } from '../screens/orders/OrderTrackingScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { Colors } from '../constants/colors';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { AddressesScreen } from '../screens/address/AddressesScreen';
import { AddAddressScreen } from "../screens/address/AddAddressScreen";
import { EditAddressScreen } from "../screens/address/EditAddressScreen";
import PaymentScreen from "../screens/payment/PaymentScreen";
import PaymentMethodsScreen from "../screens/payment/PaymentMethodsScreen";
import AddCardScreen from "../screens/payment/AddCardScreen";
import { LocationSelectScreen } from "../screens/location/LocationSelectScreen";
import NotificationsScreen from '../screens/notification/NotificationsScreen';
import NotificationDetailScreen from '../screens/notification/NotificationDetailScreen';


const Stack = createNativeStackNavigator();

// ✅ Separate component so useSocket only mounts when logged in
const AuthenticatedNavigator = () => {
  useSocket(); // ✅ now only called when user is confirmed logged in

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="MainApp" component={BottomTabNavigator} />
      <Stack.Screen name="RestaurantDetailScreen" component={RestaurantDetailScreen} />
      <Stack.Screen name="CartScreen" component={CartScreen} />
      <Stack.Screen name="CheckoutScreen" component={CheckoutScreen} />
      <Stack.Screen name="CouponScreen" component={CouponScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="OrderTrackingScreen" component={OrderTrackingScreen} />
      <Stack.Screen name="SearchScreen" component={SearchScreen} />
      <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
      <Stack.Screen name="OrderDetailScreen" component={OrderDetailScreen} />
      <Stack.Screen name="AddressesScreen" component={AddressesScreen} />
      <Stack.Screen name="AddAddressScreen" component={AddAddressScreen} />
      <Stack.Screen name="EditAddressScreen" component={EditAddressScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="AddCard" component={AddCardScreen} />
      <Stack.Screen name="LocationSelectScreen" component={LocationSelectScreen} />
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
      <Stack.Screen name="NotificationDetailScreen" component={NotificationDetailScreen} />
    </Stack.Navigator>
  );
};

const RootNavigator = () => {
  const isLoading = useUserStore(s => s.isLoading);
  const isLoggedIn = useUserStore(s => s.isLoggedIn);

  // ⏳ Splash while hydrating AsyncStorage
  if (isLoading) {
    return <SplashScreen />;
  }

  if (!isLoggedIn) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="OtpScreen" component={OtpScreen} />
      </Stack.Navigator>
    );
  }

  // ✅ Only mounts AuthenticatedNavigator (and useSocket inside it)
  // when we know for sure the user is logged in
  return <AuthenticatedNavigator />;
};

export default RootNavigator;