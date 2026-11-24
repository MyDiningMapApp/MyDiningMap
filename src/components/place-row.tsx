import { Pressable, StyleSheet, View } from 'react-native';

import { RatingBadge } from '@/components/rating-input';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PLACE_TYPES, PRICE_LABELS, type Place } from '@/lib/places';

export function PlaceRow({ place, onPress }: { place: Place; onPress: () => void }) {
  const theme = useTheme();
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
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <ThemedText style={styles.icon}>{PLACE_TYPES[place.type].icon}</ThemedText>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <ThemedText type="smallBold" style={styles.name} numberOfLines={1}>
            {place.name}
          </ThemedText>
          {place.status === 'visited' ? (
            <RatingBadge rating={place.rating} />
          ) : (
            <ThemedText type="small" style={styles.wish}>
              ♡
            </ThemedText>
          )}
        </View>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {meta}
          {place.status === 'visited' && place.would_return ? '  ↺ visszamennék' : ''}
        </ThemedText>
        {place.lat == null ? (
          <ThemedText type="small" themeColor="textSecondary">
            📍 nincs helyszín megadva
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 26,
    lineHeight: 32,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
    fontSize: 16,
  },
  wish: {
    color: '#2F80ED',
    fontSize: 18,
  },
});
