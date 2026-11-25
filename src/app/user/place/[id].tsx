import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { PlaceDetails } from '@/components/place-details';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getCachedPhotos } from '@/lib/photos';
import { getCachedPlace } from '@/lib/social';

/** Más felhasználó helyének adatlapja (csak olvasható). */
export default function OtherPlaceScreen() {
  const { id, owner } = useLocalSearchParams<{ id: string; owner?: string }>();
  const place = getCachedPlace(id);

  if (!place) {
    return (
      <ThemedView style={styles.missing}>
        <Stack.Screen options={{ title: '' }} />
        <ThemedText themeColor="textSecondary">Ez a hely nem található.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: '' }} />
      <PlaceDetails
        place={place}
        photos={getCachedPhotos(place.id)}
        subtitle={owner ? `@${owner} helye` : undefined} />
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
