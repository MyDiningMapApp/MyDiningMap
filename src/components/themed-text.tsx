import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { Fonts, fontFamilyForWeight, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

/**
 * Szöveg a téma színeivel és a Plus Jakarta Sans betűtípussal.
 * A `fontWeight`-et a megfelelő betűváltozatra cseréli (egyedi betűtípusnál ez kell iOS-en).
 */
export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const flat = StyleSheet.flatten([
    { color: theme[themeColor ?? 'text'] },
    styles[type],
    type === 'linkPrimary' ? { color: theme.accent } : null,
    style,
  ]) as TextStyle;
  const { fontWeight, ...restStyle } = flat;
  const fontFamily =
    type === 'code' ? Fonts.mono : (restStyle.fontFamily ?? fontFamilyForWeight(fontWeight));
  return <Text style={[restStyle, { fontFamily }]} {...rest} />;
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  title: {
    fontSize: 44,
    fontWeight: 800,
    lineHeight: 50,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 800,
    letterSpacing: -0.3,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    fontWeight: 600,
  },
  code: {
    fontSize: 12,
  },
});
