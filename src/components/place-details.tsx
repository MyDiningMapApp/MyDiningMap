import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MiniMap } from '@/components/place-map';
import { PlacePhotos } from '@/components/place-photos';
import { RatingBadge } from '@/components/rating-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { PlacePhoto } from '@/lib/photos';
import { PLACE_TYPES, PRICE_LABELS, type Place } from '@/lib/places';

type Props = {
  place: Place;
  photos?: PlacePhoto[];
  /** Kiegészítő sor a fejléc alatt (pl. kinek a helye). */
  subtitle?: string;
  /** Gombok az adatlap alján (saját helynél: szerkesztés, törlés). */
  actions?: React.ReactNode;
};

/** Egy hely adatlapja; saját és más felhasználó helyéhez is. */
export function PlaceDetails({ place, photos = [], subtitle, actions }: Props) {
  const type = PLACE_TYPES[place.type];
  const visited = place.status === 'visited';

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText style={styles.icon}>{type.icon}</ThemedText>
        <ThemedText type="subtitle" style={styles.center}>
          {place.name}
        </ThemedText>
        <View style={styles.badges}>
          <ThemedText themeColor="textSecondary">{type.label}</ThemedText>
          {visited ? (
            <RatingBadge rating={place.rating} />
          ) : (
            <ThemedText style={styles.wish}>♡ Kívánságlista</ThemedText>
          )}
        </View>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      <PlacePhotos photos={photos} />

      <MiniMap place={place} />

      <ThemedView type="backgroundElement" style={styles.card}>
        <Row label="Cím" value={place.address} />
        <Row label="Kerület" value={place.district ? `${place.district}. kerület` : null} />
        <Row label="Konyha" value={place.cuisine} />
        <Row label="Árszint" value={place.price ? PRICE_LABELS[place.price] : null} />
        {visited ? <Row label="Visszamenne" value={place.would_return ? 'Igen' : 'Nem'} /> : null}
        {place.url ? (
          <View style={styles.row}>
            <ThemedText type="small" themeColor="textSecondary">
              Link
            </ThemedText>
            <Pressable onPress={() => Linking.openURL(place.url!)}>
              <ThemedText type="linkPrimary" numberOfLines={1}>
                {place.url}
              </ThemedText>
            </Pressable>
          </View>
        ) : null}
      </ThemedView>

      {place.notes ? (
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="small" themeColor="textSecondary">
            Jegyzet
          </ThemedText>
          <ThemedText>{place.notes}</ThemedText>
        </ThemedView>
      ) : null}

      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  icon: {
    fontSize: 44,
    lineHeight: 52,
  },
  center: {
    textAlign: 'center',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  wish: {
    color: '#2F80ED',
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
  },
  row: {
    gap: 2,
  },
  actions: {
    gap: Spacing.two,
  },
});
