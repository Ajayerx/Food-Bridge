import {Platform, TextStyle} from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const fontFamilyMono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const typography = {
  // Headings
  h1: {
    fontFamily,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
  } as TextStyle,
  h2: {
    fontFamily,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    letterSpacing: -0.3,
  } as TextStyle,
  h3: {
    fontFamily,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  } as TextStyle,
  h4: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  } as TextStyle,

  // Body
  bodyLarge: {
    fontFamily,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  } as TextStyle,
  body: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } as TextStyle,
  bodySmall: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  } as TextStyle,

  // Labels
  label: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  } as TextStyle,
  labelSmall: {
    fontFamily,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  } as TextStyle,
  caption: {
    fontFamily,
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
  } as TextStyle,

  // Button
  button: {
    fontFamily,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  } as TextStyle,
  buttonSmall: {
    fontFamily,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  } as TextStyle,

  // Mono
  mono: {
    fontFamily: fontFamilyMono,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } as TextStyle,
} as const;

export type TypographyKey = keyof typeof typography;
