import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChipGroup, Segmented } from '@/components/chips';
import { TextField } from '@/components/form';
import { PlaceRow } from '@/components/place-row';
import { TabHeader } from '@/components/tab-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, BottomTabInset, Spacing } from '@/constants/theme';
import {
  EMPTY_FILTERS,
  PLACE_TYPE_KEYS,
  PLACE_TYPES,
  cuisineOptions,
  filterPlaces,
  type PlaceFilters,
  type PlaceStatus,
  type PlaceType,
} from '@/lib/places';
import { usePlaces } from '@/providers/places-provider';

export default function PlacesScreen() {
  const { places, loading, error, reload } = usePlaces();
  const [filters, setFilters] = useState<PlaceFilters>(EMPTY_FILTERS);
  const [refreshing, setRefreshing] = useState(false);

  const set = (patch: Partial<PlaceFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const status = filters.status as PlaceStatus;

  const visible = useMemo(() => filterPlaces(places, filters), [places, filters]);
  const counts = useMemo(
    () => ({
      visited: places.filter((p) => p.status === 'visited').length,
      wishlist: places.filter((p) => p.status === 'wishlist').length,
    }),
    [places],
  );
  // Csak a ténylegesen használt konyhák kerüljenek a szűrőbe.
  const cuisines = useMemo(
    () => cuisineOptions(places).filter((c) => places.some((p) => p.cuisine === c)),
    [places],
  );

  async function onRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  const hasFilters =
    !!filters.search || !!filters.type || !!filters.cuisine || filters.onlyWouldReturn;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <TabHeader
          title="Helyek"
          onAdd={() => router.push({ pathname: '/place/edit', params: { status } })}
        />
        <FlatList
          data={visible}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PlaceRow place={item} onPress={() => router.push(`/place/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <View style={styles.filters}>
              <Segmented<PlaceStatus>
                options={[
                  { value: 'visited', label: `Kipróbált (${counts.visited})` },
                  { value: 'wishlist', label: `♡ Kívánságlista (${counts.wishlist})` },
                ]}
                value={status}
                onChange={(v) =>
                  set({ status: v, onlyWouldReturn: v === 'visited' && filters.onlyWouldReturn })
                }
              />
              <TextField
                label="Keresés"
                value={filters.search}
                onChangeText={(t) => set({ search: t })}
                placeholder="Név, cím, jegyzet…"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              <ChipGroup<PlaceType | null>
                scroll
                allowDeselect
                emptyValue={null}
                value={filters.type}
                onChange={(v) => set({ type: v })}
                options={PLACE_TYPE_KEYS.map((k) => ({
                  value: k,
                  label: `${PLACE_TYPES[k].icon} ${PLACE_TYPES[k].label}`,
                }))}
              />
              {cuisines.length > 0 ? (
                <ChipGroup<string | null>
                  scroll
                  allowDeselect
                  emptyValue={null}
                  value={filters.cuisine}
                  onChange={(v) => set({ cuisine: v })}
                  options={cuisines.map((c) => ({ value: c, label: c }))}
                />
              ) : null}
              {status === 'visited' ? (
                <View style={styles.switchRow}>
                  <ThemedText type="small">Csak ahová visszamennék</ThemedText>
                  <Switch
                    value={filters.onlyWouldReturn}
                    onValueChange={(v) => set({ onlyWouldReturn: v })}
                    trackColor={{ true: Accent }}
                  />
                </View>
              ) : null}
              {error ? (
                <ThemedText type="small" style={styles.error}>
                  {error} Húzd le a listát az újrapróbáláshoz.
                </ThemedText>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            loading ? undefined : (
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                {hasFilters
                  ? 'Nincs a szűrésnek megfelelő hely.'
                  : status === 'visited'
                    ? 'Még nincs kipróbált helyed. Vegyél fel egyet a „＋ Új hely” gombbal!'
                    : 'A kívánságlistád üres. Ide azokat a helyeket veheted fel, ahová még el szeretnél menni.'}
              </ThemedText>
            )
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  filters: {
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  error: {
    color: '#D93025',
  },
});
