import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { cardShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Kör alakú monogram a felhasználónév/megjelenített név első betűjéből. */
export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const theme = useTheme();
  const letter = name.replace(/^@/, '').trim().charAt(0).toUpperCase() || '?';
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.accentSoft,
          borderColor: theme.backgroundElement,
          borderWidth: size >= 40 ? 2 : 0,
        },
        size >= 40 && cardShadow(theme),
      ]}>
      <ThemedText
        style={{
          color: theme.onAccentSoft,
          fontSize: size * 0.42,
          lineHeight: size * 0.6,
          fontWeight: 800,
        }}>
        {letter}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
