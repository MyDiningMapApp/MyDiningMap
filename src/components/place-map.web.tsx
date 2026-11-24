// Webes helyettesítő: a react-native-maps nem fut böngészőben. Az app térképe iOS-en működik.
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BUDAPEST_REGION, type Place } from '@/lib/places';

function Placeholder({ text, children }: { text: string; children?: React.ReactNode }) {
  return (
    <ThemedView type="backgroundElement" style={styles.box}>
      <ThemedText themeColor="textSecondary" style={styles.center}>
        🗺️ {text}
      </ThemedText>
      {children}
    </ThemedView>
  );
}

export function PlacesMap({
  places,
  onOpenPlace,
}: {
  places: Place[];
  onOpenPlace: (id: string) => void;
}) {
  const withCoords = places.filter((p) => p.lat != null);
  return (
    <View style={StyleSheet.absoluteFill}>
      <Placeholder text={`Térkép (csak a telefonon). ${withCoords.length} hely koordinátával.`}>
        {withCoords.slice(0, 5).map((p) => (
          <Pressable key={p.id} onPress={() => onOpenPlace(p.id)}>
            <ThemedText type="linkPrimary">{p.name}</ThemedText>
          </Pressable>
        ))}
      </Placeholder>
    </View>
  );
}

export function PickerMap({
  point,
  onPick,
}: {
  point: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
}) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Placeholder text={point ? `Kijelölve: ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` : 'Kijelölés térképen (csak a telefonon)'}>
        <Pressable onPress={() => onPick(BUDAPEST_REGION.latitude, BUDAPEST_REGION.longitude)}>
          <ThemedText type="linkPrimary">Teszt: Budapest közepe</ThemedText>
        </Pressable>
      </Placeholder>
    </View>
  );
}

export function MiniMap({ place }: { place: Place }) {
  if (place.lat == null || place.lng == null) return null;
  return (
    <View style={styles.mini}>
      <Placeholder text={`${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    padding: 16,
  },
  center: {
    textAlign: 'center',
  },
  mini: {
    height: 180,
  },
});
