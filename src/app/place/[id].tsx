import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/form';
import { PlaceDetails } from '@/components/place-details';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { confirm, showError } from '@/lib/confirm';
import { usePlaces } from '@/providers/places-provider';

/** Saját hely adatlapja, szerkesztéssel és törléssel. */
export default function PlaceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPlace, deletePlace, photosByPlace } = usePlaces();
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
      showError((e as Error).message);
    }
  }

  const visited = place.status === 'visited';

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: '' }} />
      <PlaceDetails
        place={place}
        photos={photosByPlace[place.id]}
        actions={
          <>
            {!visited ? (
              <Button
                title="Voltam itt!"
                icon="check"
                onPress={() =>
                  router.push({
                    pathname: '/place/edit',
                    params: { id: place.id, markVisited: '1' },
                  })
                }
              />
            ) : null}
            <Button
              title="Szerkesztés"
              icon="pencil"
              variant={visited ? 'primary' : 'secondary'}
              onPress={() => router.push({ pathname: '/place/edit', params: { id: place.id } })}
            />
            <Button
              title="Törlés"
              variant="danger"
              loading={deleting}
              onPress={() =>
                confirm('Hely törlése', `Biztosan törlöd: ${place.name}?`, 'Törlés', doDelete)
              }
            />
          </>
        }
      />
    </ThemedView>
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
});
