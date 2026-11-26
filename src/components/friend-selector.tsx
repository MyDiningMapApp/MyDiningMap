import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { cardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { displayName, type Friendship } from '@/lib/social';

type Props = {
  friends: Friendship[];
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Ezek már meghívottak (nem választhatók újra). */
  disabledIds?: string[];
};

/** Barátok kiválasztása jelölőkkel. */
export function FriendSelector({ friends, selected, onChange, disabledIds = [] }: Props) {
  const theme = useTheme();
  if (friends.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        Még nincs barátod. A Barátok fülön kereshetsz rá valakire.
      </ThemedText>
    );
  }
  return (
    <View style={styles.list}>
      {friends.map((f) => {
        const disabled = disabledIds.includes(f.id);
        const checked = disabled || selected.includes(f.id);
        return (
          <Pressable
            key={f.id}
            disabled={disabled}
            accessibilityRole="checkbox"
            accessibilityState={{ checked, disabled }}
            accessibilityLabel={displayName(f)}
            onPress={() =>
              onChange(checked ? selected.filter((id) => id !== f.id) : [...selected, f.id])
            }
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: theme.backgroundElement },
              cardShadow(theme),
              (pressed || disabled) && styles.dim,
            ]}>
            <Avatar name={displayName(f)} size={32} />
            <View style={styles.flex}>
              <ThemedText type="smallBold">{displayName(f)}</ThemedText>
              {f.display_name ? (
                <ThemedText type="small" themeColor="textSecondary">
                  @{f.username}
                </ThemedText>
              ) : null}
            </View>
            <View
              style={[
                styles.box,
                { borderColor: checked ? theme.accent : theme.textSecondary },
                checked && { backgroundColor: theme.accent },
              ]}>
              {checked ? <Icon name="check" size={14} color={theme.onAccent} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    paddingRight: Spacing.three,
    borderRadius: Radius.medium,
  },
  dim: {
    opacity: 0.6,
  },
  flex: {
    flex: 1,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
