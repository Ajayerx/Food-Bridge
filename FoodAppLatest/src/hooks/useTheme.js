// hooks/useTheme.js
import { useUserStore } from '../store/userStore';
import { Colors, DarkColors } from '../constants/colors';

/**
 * Returns the correct color palette based on dark mode setting.
 * Usage in any component:
 *   const Colors = useTheme();
 *   <View style={{ backgroundColor: Colors.background }} />
 */
export const useTheme = () => {
    const darkMode = useUserStore(s => s.darkMode);
    return darkMode ? DarkColors : Colors;
};