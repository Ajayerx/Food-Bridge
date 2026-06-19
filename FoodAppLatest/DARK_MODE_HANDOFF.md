# Dark Mode Handoff — FoodBridge (UPDATED)

## ✅ All 47 Plan Files Converted

| Area | Count | Status |
|------|-------|--------|
| Components | 19/19 | ✅ All use `useTheme()` |
| Navigators | 2/2 | ✅ BottomTabNavigator, RootNavigator |
| Screens | 25/25 | ✅ All use `useTheme()` |
| Constants | 1/1 | ✅ `mapStyle.js` has `getMapStyle(isDark)` |
| **Total** | **47/47** | **✅ DONE** |

## Files Changed in This Session

### Payment screens (3)
- `src/screens/payment/PaymentScreen.js` — Was importing `Colors` directly, now uses `useTheme()`
- `src/screens/payment/PaymentMethodsScreen.js` — Had no theme imports, now uses `useTheme()`
- `src/screens/payment/AddCardScreen.js` — Had no theme imports, now uses `useTheme()`

### Components (1)
- `src/components/common/NotificationToast.js` — Had no theme imports, now uses `useTheme()`

### SearchScreen (1)
- `src/screens/search/SearchScreen.js` — Fixed 12 undefined constant references (`WHITE`, `TEXT_LIGHT`, `GREEN`, `PRIMARY`, `TEXT_MID`); all 10 sub-components now self-contained with `useTheme()`

### Per-screen StatusBars (12 screens)
All changed from `barStyle="dark-content"` to `barStyle={darkMode ? 'light-content' : 'dark-content'}`:
- AddAddressScreen, AddressesScreen, CartScreen (2), CheckoutScreen, CouponScreen, EditAddressScreen, EditProfileScreen, HomeScreen, LocationSelectScreen, LoginScreen, OrdersScreen, OtpScreen, SearchScreen

### Bug fixes (3)
- **HomeScreen.js** — Fixed `ReferenceError: Property 'Colors' doesn't exist` by converting module-level `const styles = StyleSheet.create({...Colors...})` to `const createStyles = (C) => StyleSheet.create({...C...})`
- **VegNonVegIcon.js** — Fixed `ReferenceError: createStyles is not defined` by removing broken `useMemo(() => createStyles(Colors), [Colors])` call
- **SearchScreen.js (VegDot)** — Fixed `ReferenceError: s is not defined` by adding `const s = useMemo(() => createS(C), [C])`

## State Issues Fixed (2025-06-17)

### Root Cause 1: `toggleDarkMode` async race condition
**File:** `src/store/userStore.js:113`
**Problem:** `toggleDarkMode` was `async` and ignored the Switch's `onValueChange` value, instead reading `get().darkMode` after an `await AsyncStorage.setItem(...)`. This created a window where React re-rendered with stale `darkMode`, making the Switch snap back visually and requiring a second tap.
**Fix:** Made the store update synchronous (before persist), accepting the Switch's value as a parameter:
```js
toggleDarkMode: (next) => {
  const value = typeof next === 'boolean' ? next : !get().darkMode;
  set({ darkMode: value });
  AsyncStorage.setItem(DARK_MODE_KEY, String(value)).catch(() => {});
},
```

### Root Cause 2: `React.memo` on `AuthenticatedNavigator`
**File:** `src/navigation/RootNavigator.js:59`
**Problem:** `AuthenticatedNavigator` was wrapped in `React.memo`, which could block re-render propagation of `screenOptions.contentStyle` (which uses `Colors.background` from `useTheme()`). While Zustand hooks bypass `React.memo`, the memoization added risk of stale closures.
**Fix:** Removed `React.memo` wrapper to ensure this component always re-renders when `darkMode` changes.

## Architecture (In place)

```
userStore.darkMode ──► useTheme() ──► Colors (light) or DarkColors (dark)
                         │
                         ▼
               useMemo(createStyles, [Colors])
```

## Conversion Pattern
```js
import { useTheme } from '../../hooks/useTheme';
const Component = () => {
  const Colors = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return <View style={styles.container} />;
};
const createStyles = C => StyleSheet.create({...});
```

## Core Files
| File | Purpose |
|------|---------|
| `src/hooks/useTheme.js` | Returns `DarkColors` or `Colors` based on `userStore.darkMode` |
| `src/constants/colors.js` | Both palettes (`Colors` / `DarkColors`) |
| `src/store/userStore.js` | `darkMode` state + `toggleDarkMode()` + AsyncStorage persistence |
| `src/constants/mapStyle.js` | `getMapStyle(isDark)` for map dark mode |
| `App.tsx` | Root `<StatusBar>` + `<NavigationContainer>` theme switching |
| `src/screens/profile/ProfileScreen.js` | `Switch` component toggling dark mode |

## Testing Checklist
- [ ] Toggle dark mode → all 47 files update immediately
- [ ] Toggle persists after app restart (AsyncStorage `app_dark_mode`)
- [ ] Toggle resets on logout
- [ ] All text readable (no black-on-black, white-on-white)
- [ ] StatusBar switches correctly on every screen
- [ ] Map renders in dark mode (`LocationPickerScreen`)
- [ ] Tab bar bg/border switches
- [ ] Shimmer colors switch
- [ ] No performance regression

## Run
`npx react-native run-android` to verify.
