import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { cardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ProfileSummary } from '@/lib/social';

type Props = {
  profile: Pick<ProfileSummary, 'username' | 'display_name' | 'visibility'>;
  onPress?: () => void;
  /** Jobb oldali tartalom vagy alatta megjelenő gombok. */
  children?: React.ReactNode;
};

/** Felhasználó sora: monogram, név, @felhasználónév, láthatóság; alatta opcionális gombok. */
export function ProfileRow({ profile, onPress, children }: Props) {
  const theme = useTheme();
  const name = profile.display_name?.trim();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }, cardShadow(theme)]}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <Avatar name={name || profile.username} />
        <View style={styles.body}>
          <ThemedText type="smallBold" style={styles.name} numberOfLines={1}>
            {name || `@${profile.username}`}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {name ? `@${profile.username} · ` : ''}
            {profile.visibility === 'public' ? 'Publikus profil' : 'Privát profil'}
          </ThemedText>
        </View>
        {onPress ? <Icon name="chevron" size={16} color={theme.textSecondary} /> : null}
      </Pressable>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
  },
});
