import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Accent } from '@/constants/theme';

/** Kör alakú monogram a felhasználónév/megjelenített név első betűjéből. */
export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const letter = name.replace(/^@/, '').trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <ThemedText style={[styles.letter, { fontSize: size * 0.45, lineHeight: size * 0.6 }]}>
        {letter}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: Accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: '#ffffff',
    fontWeight: 700,
  },
});
