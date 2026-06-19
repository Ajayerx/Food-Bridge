# Dark Mode Implementation Plan — FoodBridge App

## Architecture

Hook-based dynamic styles using Zustand + `useTheme()`.

```
userStore.darkMode ──► useTheme() ──► Colors (light) or DarkColors (dark)
                        │
                        ▼
              useMemo(createStyles, [Colors])
                        │
                        ▼
                StyleSheet.create(C.*)
```

## Foundation (Already Done)

| Piece         | File                                                       | Status |
| ------------- | ---------------------------------------------------------- | ------ |
| Light palette | `src/constants/colors.js` — `Colors`                       | ✅     |
| Dark palette  | `src/constants/colors.js` — `DarkColors`                   | ✅     |
| Store state   | `src/store/userStore.js` — `darkMode` + `toggleDarkMode()` | ✅     |
| Persistence   | `src/store/userStore.js` — AsyncStorage `app_dark_mode`    | ✅     |
| Theme hook    | `src/hooks/useTheme.js` — `useTheme()`                     | ✅     |
| Toggle UI     | `src/screens/profile/ProfileScreen.js` — Switch component  | ✅     |

## Conversion Pattern

### Before

```js
import {Colors} from '../../constants/colors';

const Component = () => <View style={styles.container} />;

const styles = StyleSheet.create({
  container: {backgroundColor: Colors.background},
});
```

### After

```js
import {useTheme} from '../../hooks/useTheme';

const Component = () => {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return <View style={styles.container} />;
};

const createStyles = C =>
  StyleSheet.create({
    container: {backgroundColor: C.background},
  });
```

## StatusBar Conversion

| Current                                        | Dark Mode                                        | Rule              |
| ---------------------------------------------- | ------------------------------------------------ | ----------------- |
| `barStyle="dark-content" bg={Colors.white}`    | `barStyle="light-content" bg={DarkColors.white}` | Switch both       |
| `barStyle="light-content" bg={Colors.primary}` | No change                                        | Brand colors same |
| `barStyle="light-content" bg="transparent"`    | No change                                        | Transparent stays |
| `barStyle="light-content" bg={dynamicColor}`   | No change                                        | Dynamic stays     |

## Map Style

`src/constants/mapStyle.js` exports `getMapStyle(isDark)`:

- `isDark=false` → returns existing `MAP_STYLE`
- `isDark=true` → returns modified copy with dark backgrounds/text/roads

`LocationPickerScreen.js` uses `useMemo(() => getMapStyle(isDark), [isDark])`

## Files to Modify (47 files)

### Components (19)

Button, Header, Badge, Chip, Divider, EmptyState, Loader, NotificationToast,
OfferTag, RatingStars, ReviewCard, VegNonVegIcon, CartItemCard, DishCard,
OrderCard, RestaurantCard, CartBar, SearchBar, NotificationCard

### Navigation (2)

BottomTabNavigator, RootNavigator

### Screens (25)

HomeScreen, AddAddressScreen, EditAddressScreen, AddressesScreen,
LocationPickerScreen (map), LocationSelectScreen, CartScreen, CouponScreen,
CheckoutScreen, LoginScreen, OtpScreen, SplashScreen, SearchScreen (+hardcoded colors),
ProfileScreen, EditProfileScreen, RestaurantDetailScreen, OrdersScreen,
OrderDetailScreen, OrderTrackingScreen, NotificationsScreen,
NotificationDetailScreen, PaymentScreen, PaymentMethodsScreen, AddCardScreen,
ReviewScreen

### Constants (1)

mapStyle.js — add `getMapStyle(isDark)`

## Testing Checklist

- [ ] Toggle dark mode → all screens update immediately
- [ ] Toggle persists after restart
- [ ] Toggle resets on logout
- [ ] All text readable (no black-on-black, white-on-white)
- [ ] StatusBar switches correctly
- [ ] Map renders in dark mode
- [ ] Tab bar bg/border switches
- [ ] Shimmer colors switch
- [ ] No performance regression

Limit exceeded

Todos
[✓] Convert OfferTag.js to useTheme
[✓] Convert RatingStars.js to useTheme
[✓] Convert ReviewCard.js to useTheme
[✓] Convert VegNonVegIcon.js to useTheme
[✓] Convert remaining 7 component files (CartItemCard, DishCard, OrderCard, RestaurantCard, CartBar, SearchBar, Header)
[✓] Convert NotificationCard.js to useTheme
[✓] Convert 2 navigation files (BottomTabNavigator, RootNavigator)
[✓] Convert auth screens (SplashScreen, LoginScreen, OtpScreen)
[✓] Convert simple screens batch 1 (OrdersScreen, NotificationsScreen, NotificationDetailScreen, EditProfileScreen, CouponScreen)
[✓] Convert address + location screens (AddressesScreen, AddAddressScreen, EditAddressScreen, LocationSelectScreen)
[✓] Convert complex screens (ProfileScreen, ReviewScreen, OrderTrackingScreen, OrderDetailScreen)
[•] Convert CartScreen, CheckoutScreen, PaymentScreen
[ ] Convert RestaurantDetailScreen
[ ] Convert HomeScreen (complex, ~1200 lines)
[ ] Fix SearchScreen hardcoded color constants + convert
[ ] Verify build and theme toggle end-to-end
