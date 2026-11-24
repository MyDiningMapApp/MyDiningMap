import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/form';
import { MiniMap } from '@/components/place-map';
import { RatingBadge } from '@/components/rating-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { PLACE_TYPES, PRICE_LABELS } from '@/lib/places';
import { usePlaces } from '@/providers/places-provider';

export default function PlaceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPlace, deletePlace } = usePlaces();
  const place = getPlace(id);
  const [deleting, setDeleting] = useState(false);

  if (!place) {
    return (
      <ThemedView style={styles.missing}>
        <Stack.Screen options={{ title: '' }} />
        <ThemedText themeColor="textSecondary">Ez a hely nem található.</ThemedText>
      </ThemedView>
    );
  }

  async function doDelete() {
    setDeleting(true);
    try {
      await deletePlace(place!.id);
      router.back();
    } catch (e) {
      setDeleting(false);
      Alert.alert('Hiba', (e as Error).message);
    }
  }

  function confirmDelete() {
    const question = `Biztosan törlöd: ${place!.name}?`;
    if (Platform.OS === 'web') {
      if (window.confirm(question)) doDelete();
      return;
    }
    Alert.alert('Hely törlése', question, [
      { text: 'Mégse', style: 'cancel' },
      { text: 'Törlés', style: 'destructive', onPress: doDelete },
    ]);
  }

  const type = PLACE_TYPES[place.type];
  const visited = place.status === 'visited';

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={styles.content}>
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
        </View>

        <MiniMap place={place} />

        <ThemedView type="backgroundElement" style={styles.card}>
          <Row label="Cím" value={place.address} />
          <Row label="Kerület" value={place.district ? `${place.district}. kerület` : null} />
          <Row label="Konyha" value={place.cuisine} />
          <Row label="Árszint" value={place.price ? PRICE_LABELS[place.price] : null} />
          {visited ? (
            <Row label="Visszamennék" value={place.would_return ? 'Igen' : 'Nem'} />
          ) : null}
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

        <View style={styles.actions}>
          {!visited ? (
            <Button
              title="✓ Voltam itt!"
              onPress={() =>
                router.push({ pathname: '/place/edit', params: { id: place.id, markVisited: '1' } })
              }
            />
          ) : null}
          <Button
            title="Szerkesztés"
            variant={visited ? 'primary' : 'secondary'}
            onPress={() => router.push({ pathname: '/place/edit', params: { id: place.id } })}
          />
          <Button title="Törlés" variant="secondary" onPress={confirmDelete} loading={deleting} />
        </View>
      </ScrollView>
    </ThemedView>
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
  flex: {
    flex: 1,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
