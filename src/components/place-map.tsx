import { StyleSheet } from 'react-native';
import MapView, { Marker, type MapPressEvent, type Region } from 'react-native-maps';

import { BUDAPEST_REGION, PLACE_TYPES, placeColor, type Place } from '@/lib/places';

type PlacesMapProps = {
  places: Place[];
  onOpenPlace: (id: string) => void;
  initialRegion?: Region;
};

/** Térkép a helyek pinjeivel (iOS-en Apple Maps). */
export function PlacesMap({ places, onOpenPlace, initialRegion }: PlacesMapProps) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={initialRegion ?? BUDAPEST_REGION}
      showsUserLocation={false}
      showsPointsOfInterests={false}>
      {places
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat!, longitude: p.lng! }}
            pinColor={placeColor(p)}
            title={p.name}
            description={
              p.status === 'wishlist'
                ? `${PLACE_TYPES[p.type].label} · kívánságlista · koppints a részletekért`
                : `${PLACE_TYPES[p.type].label}${p.rating != null ? ` · ${p.rating}/10` : ''} · koppints a részletekért`
            }
            onCalloutPress={() => onOpenPlace(p.id)}
          />
        ))}
    </MapView>
  );
}

type PickerMapProps = {
  point: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
};

/** Térkép egy kijelölhető ponttal (koppintásra áthelyezi a pint). */
export function PickerMap({ point, onPick }: PickerMapProps) {
  const region: Region = point
    ? { latitude: point.lat, longitude: point.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : BUDAPEST_REGION;
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={region}
      onPress={(e: MapPressEvent) =>
        onPick(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)
      }>
      {point ? (
        <Marker
          coordinate={{ latitude: point.lat, longitude: point.lng }}
          draggable
          onDragEnd={(e) =>
            onPick(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)
          }
        />
      ) : null}
    </MapView>
  );
}

/** Kis, nem mozgatható térkép egyetlen ponttal (hely vagy esemény adatlapjára). */
export function MiniMap({ place }: { place: Pick<Place, 'lat' | 'lng' | 'status' | 'rating'> }) {
  if (place.lat == null || place.lng == null) return null;
  return (
    <MapView
      style={styles.mini}
      pointerEvents="none"
      scrollEnabled={false}
      zoomEnabled={false}
      initialRegion={{
        latitude: place.lat,
        longitude: place.lng,
        latitudeDelta: 0.006,
        longitudeDelta: 0.006,
      }}>
      <Marker coordinate={{ latitude: place.lat, longitude: place.lng }} pinColor={placeColor(place)} />
    </MapView>
  );
}

const styles = StyleSheet.create({
  mini: {
    height: 180,
    borderRadius: 16,
  },
});
