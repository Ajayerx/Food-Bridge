export const palette = {
  // Brand
  primary: '#FC8019',
  primaryLight: '#FFA94D',
  primaryDark: '#E06A00',

  // Status
  success: '#60B246',
  successLight: '#E8F5E9',
  warning: '#FFA000',
  warningLight: '#FFF8E1',
  error: '#E53935',
  errorLight: '#FFEBEE',
  info: '#2196F3',
  infoLight: '#E3F2FD',

  // Neutrals (Light)
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceVariant: '#FAFAFA',
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textOnPrimary: '#FFFFFF',

  // Neutrals (Dark)
  backgroundDark: '#121212',
  surfaceDark: '#1E1E1E',
  surfaceVariantDark: '#2C2C2C',
  borderDark: '#333333',
  borderLightDark: '#2A2A2A',
  textPrimaryDark: '#E0E0E0',
  textSecondaryDark: '#9E9E9E',
  textDisabledDark: '#616161',
  textOnPrimaryDark: '#FFFFFF',

  // Misc
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Avatar backgrounds
  avatarColors: [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
  ],
} as const;

export type ColorKey = keyof typeof palette;

export const lightColors = {
  ...palette,
  background: palette.background,
  surface: palette.surface,
  surfaceVariant: palette.surfaceVariant,
  border: palette.border,
  borderLight: palette.borderLight,
  textPrimary: palette.textPrimary,
  textSecondary: palette.textSecondary,
  textDisabled: palette.textDisabled,
  textOnPrimary: palette.textOnPrimary,
};

export const darkColors = {
  ...palette,
  background: palette.backgroundDark,
  surface: palette.surfaceDark,
  surfaceVariant: palette.surfaceVariantDark,
  border: palette.borderDark,
  borderLight: palette.borderLightDark,
  textPrimary: palette.textPrimaryDark,
  textSecondary: palette.textSecondaryDark,
  textDisabled: palette.textDisabledDark,
  textOnPrimary: palette.textOnPrimaryDark,
};
