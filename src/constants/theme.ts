/**
 * Az app színei – „Bézs és burgundi” téma, világos és sötét változatban.
 * Minden szín innen jön; komponensben ne legyen szétszórt hex kód.
 * A szövegszínek kontrasztja minden párosításnál legalább 4,5:1.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    /** Oldal háttere (meleg bézs). */
    background: '#F6EFE6',
    /** Kártyák, mezők, választók háttere (krémfehér). */
    backgroundElement: '#FFFCF8',
    /** Kártyán belüli elemek, kiválasztott állapot, szegmens-sáv. */
    backgroundSelected: '#EDE2D5',
    text: '#2B1A1F',
    textSecondary: '#6F5C60',
    border: '#EDE2D5',
    /** Fő szín: burgundi. */
    accent: '#9B3550',
    onAccent: '#FFFFFF',
    accentSoft: '#F5DCE3',
    onAccentSoft: '#83283F',
    danger: '#B42318',
    dangerSoft: '#FDE8E5',
    wishlist: '#1D4ED8',
    wishlistSoft: '#DCE8FF',
    onWishlistSoft: '#1E3A8A',
    ratingHighBg: '#D7F5E4',
    ratingHighInk: '#0B4D2E',
    ratingMidBg: '#FFF0C2',
    ratingMidInk: '#7A4A00',
    ratingLowBg: '#FFE1DC',
    ratingLowInk: '#7F1D1D',
    shadow: '#2B1A1F',
  },
  dark: {
    /** Sötét bordós-barna. */
    background: '#1D1416',
    backgroundElement: '#291E21',
    backgroundSelected: '#3A2A2E',
    text: '#F4EAE4',
    textSecondary: '#BCA9A6',
    border: '#3A2A2E',
    /** Fő szín: világosabb, rózsás burgundi. */
    accent: '#E28CA2',
    onAccent: '#2B0D16',
    accentSoft: '#4A2330',
    onAccentSoft: '#F7CAD6',
    danger: '#FF8A7A',
    dangerSoft: '#3D1414',
    wishlist: '#8AB4FF',
    wishlistSoft: '#16264D',
    onWishlistSoft: '#BCD3FF',
    ratingHighBg: '#123828',
    ratingHighInk: '#B7F0D2',
    ratingMidBg: '#3A2C0A',
    ratingMidInk: '#FFE08A',
    ratingLowBg: '#3D1414',
    ratingLowInk: '#FFC2B8',
    shadow: '#000000',
  },
} as const;

export type Theme = (typeof Colors)['light'] | (typeof Colors)['dark'];

/** Kártyák lágy árnyéka (iOS-en és weben látszik; Androidon az elevation). */
export function cardShadow(theme: Theme, strength: 'soft' | 'raised' = 'soft') {
  const raised = strength === 'raised';
  return {
    shadowColor: theme.shadow,
    shadowOpacity: raised ? 0.14 : 0.07,
    shadowRadius: raised ? 18 : 10,
    shadowOffset: { width: 0, height: raised ? 8 : 4 },
    elevation: raised ? 6 : 2,
  };
}

/** Lekerekítések. */
export const Radius = {
  small: 12,
  medium: 16,
  card: 22,
  pill: 999,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Plus Jakarta Sans változatai (a _layout.tsx tölti be). */
export const FontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

/** fontWeight → a hozzá tartozó betűváltozat (egyedi betűtípusnál a vastagság a család része). */
export function fontFamilyForWeight(weight: string | number | undefined): string {
  const w = Number(weight === 'bold' ? 700 : weight === 'normal' || weight == null ? 400 : weight);
  if (w >= 800) return FontFamily.extrabold;
  if (w >= 700) return FontFamily.bold;
  if (w >= 600) return FontFamily.semibold;
  if (w >= 500) return FontFamily.medium;
  return FontFamily.regular;
}

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
