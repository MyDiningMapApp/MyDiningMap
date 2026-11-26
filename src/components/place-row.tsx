import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { cardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PLACE_TYPES, PRICE_LABELS, type Place } from '@/lib/places';

type Props = {
  place: Place;
  onPress: () => void;
  /** Az első fotó bélyegképe; ha nincs, a típus ikonja látszik. */
  thumbUri?: string;
  /** Igaz, ha van fotó, de a link még töltődik (helyfoglaló jelenik meg). */
  hasPhoto?: boolean;
};

const THUMB = 76;

/** Egy hely kártyája a listákban: nagy fotó (vagy típus-ikon), rajta az értékelés. */
export function PlaceRow({ place, onPress, thumbUri, hasPhoto }: Props) {
  const theme = useTheme();
  const visited = place.status === 'visited';
  const meta = [
    PLACE_TYPES[place.type].label,
    place.cuisine,
    place.district ? `${place.district}. ker.` : null,
    place.price ? PRICE_LABELS[place.price] : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${place.name}, ${meta}${visited && place.rating ? `, ${place.rating} pont` : ''}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement },
        cardShadow(theme),
        pressed && styles.pressed,
      ]}>
      <View style={[styles.thumb, { backgroundColor: theme.accentSoft }]}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={styles.image} contentFit="cover" transition={150} />
        ) : hasPhoto ? null : (
          <Icon name={place.type} size={28} color={theme.onAccentSoft} />
        )}
        {visited && place.rating != null ? (
          <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
            <Icon name="star" size={11} color={theme.accent} />
            <ThemedText style={[styles.badgeText, { color: theme.text }]}>{place.rating}</ThemedText>
          </View>
        ) : null}
        {!visited ? (
          <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
            <Icon name="heart" size={11} color={theme.wishlist} />
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <ThemedText style={styles.name} numberOfLines={1}>
          {place.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {meta}
        </ThemedText>
        {visited && place.would_return ? (
          <View style={styles.tag}>
            <Icon name="again" size={12} color={theme.accent} />
            <ThemedText style={[styles.tagText, { color: theme.accent }]}>Visszamennék</ThemedText>
          </View>
        ) : null}
        {place.lat == null ? (
          <View style={styles.tag}>
            <Icon name="pin" size={12} color={theme.textSecondary} />
            <ThemedText style={[styles.tagText, { color: theme.textSecondary }]}>
              Nincs helyszín megadva
            </ThemedText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 2,
    padding: 10,
    borderRadius: Radius.card,
  },
  pressed: {
    opacity: 0.75,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: Radius.medium,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  badge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: 800,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 700,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 700,
  },
});
