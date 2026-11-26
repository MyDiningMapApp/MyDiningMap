import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Segmented } from '@/components/chips';
import { PlacesMap } from '@/components/place-map';
import { TabHeader } from '@/components/tab-header';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { PlaceStatus } from '@/lib/places';
import { usePlaces } from '@/providers/places-provider';

export default function MapScreen() {
  const { places } = usePlaces();
  const [status, setStatus] = useState<PlaceStatus | 'all'>('all');
  const visible = useMemo(
    () => places.filter((p) => status === 'all' || p.status === status),
    [places, status],
  );

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <TabHeader
          actionLabel="Új hely felvétele"
          onAction={() =>
            router.push({
              pathname: '/place/edit',
              params: { status: status === 'all' ? 'visited' : status },
            })
          }
        />
        <View style={styles.segment}>
          <Segmented<PlaceStatus | 'all'>
            options={[
              { value: 'all', label: 'Mind' },
              { value: 'visited', label: 'Kipróbált' },
              { value: 'wishlist', label: 'Kívánságlista', icon: 'heart' },
            ]}
            value={status}
            onChange={setStatus}
          />
        </View>
        <View style={styles.flex}>
          <PlacesMap places={visible} onOpenPlace={(id) => router.push(`/place/${id}`)} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  segment: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
});
