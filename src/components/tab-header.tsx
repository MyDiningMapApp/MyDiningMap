import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Icon } from '@/components/icon';
import { cardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/providers/auth-provider';

type Props = {
  /** A jobb oldali ＋ gomb képernyőolvasós felirata (pl. „Új hely felvétele”); ha nincs, nincs gomb. */
  actionLabel?: string;
  onAction?: () => void;
};

/** Fül-képernyők fejléce: balra a profilgomb, jobbra a kompakt ＋ gomb. */
export function TabHeader({ actionLabel, onAction }: Props) {
  const theme = useTheme();
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
        <Avatar name={name} size={44} />
      </Pressable>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: theme.accent },
            cardShadow(theme, 'raised'),
            pressed && styles.pressed,
          ]}>
          <Icon name="add" size={20} color={theme.onAccent} />
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
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    minHeight: 60,
  },
  action: {
    width: 44,
    height: 44,
    borderRadius: Radius.small + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
