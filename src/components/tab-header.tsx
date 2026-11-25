import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Accent, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

type Props = {
  /** A jobb oldali gomb felirata (pl. „＋ Új hely”); ha nincs, nincs gomb. */
  actionLabel?: string;
  actionAccessibilityLabel?: string;
  onAction?: () => void;
};

/** Fül-képernyők fejléce: balra a profilgomb, jobbra az opcionális művelet. */
export function TabHeader({ actionLabel, actionAccessibilityLabel, onAction }: Props) {
  const { profile } = useAuth();
  const name = profile?.display_name || profile?.username || '?';
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Profil"
        onPress={() => router.push('/profile')}
        hitSlop={8}
        style={({ pressed }) => pressed && styles.pressed}>
        <Avatar name={name} size={38} />
      </Pressable>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionAccessibilityLabel ?? actionLabel}
          onPress={onAction}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <ThemedText style={styles.actionText}>{actionLabel}</ThemedText>
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
    minHeight: 54,
  },
  action: {
    backgroundColor: Accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  actionText: {
    color: '#ffffff',
    fontWeight: 600,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.7,
  },
});
