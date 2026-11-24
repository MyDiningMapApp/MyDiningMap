import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Accent, Spacing } from '@/constants/theme';

type Props = {
  title: string;
  onAdd?: () => void;
};

/** Fül-képernyők fejléce: cím és „+ Új hely” gomb. */
export function TabHeader({ title, onAdd }: Props) {
  return (
    <View style={styles.header}>
      <ThemedText type="subtitle">{title}</ThemedText>
      {onAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Új hely felvétele"
          onPress={onAdd}
          style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
          <ThemedText style={styles.addText}>＋ Új hely</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  add: {
    backgroundColor: Accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addText: {
    color: '#ffffff',
    fontWeight: 600,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.7,
  },
});
