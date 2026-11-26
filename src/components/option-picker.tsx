import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Segmented } from '@/components/chips';
import { Button, FormError, TextField } from '@/components/form';
import { LocationPicker } from '@/components/location-picker';
import { ProfileRow } from '@/components/profile-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Icon } from '@/components/icon';
import { cardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { OptionInput } from '@/lib/events';
import { geocodeAddress, type GeocodeResult } from '@/lib/geocode';
import { districtHint, fold, type Place } from '@/lib/places';
import { displayName, getProfilePlaces, type Friendship } from '@/lib/social';
import { useFriends } from '@/providers/friends-provider';
import { usePlaces } from '@/providers/places-provider';

type Source = 'own' | 'friends' | 'new';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: OptionInput) => void;
};

const fromPlace = (p: Place): OptionInput => ({
  name: p.name,
  address: p.address,
  district: p.district,
  lat: p.lat,
  lng: p.lng,
  source_place_id: p.id,
});

/** Javasolt hely kiválasztása eseményhez: saját listáról, barát listájáról, vagy új hely. */
export function OptionPicker({ visible, onClose, onSelect }: Props) {
  const theme = useTheme();
  const [source, setSource] = useState<Source>('own');

  function select(option: OptionInput) {
    onSelect(option);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <ThemedView style={styles.flex}>
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <ThemedText type="smallBold" style={styles.title}>
              Hely javaslása
            </ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <ThemedText style={{ color: theme.accent }}>Mégse</ThemedText>
            </Pressable>
          </View>
          <View style={styles.segment}>
            <Segmented<Source>
              options={[
                { value: 'own', label: 'Saját listám' },
                { value: 'friends', label: 'Barátaimé' },
                { value: 'new', label: 'Új hely' },
              ]}
              value={source}
              onChange={setSource}
            />
          </View>
          {source === 'own' ? <OwnPlaces onSelect={select} /> : null}
          {source === 'friends' ? <FriendsPlaces onSelect={select} /> : null}
          {source === 'new' ? <NewPlace onSelect={select} /> : null}
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

function PlaceList({
  places,
  onSelect,
  empty,
  header,
}: {
  places: Place[];
  onSelect: (p: Place) => void;
  empty: string;
  header?: React.ReactElement;
}) {
  const theme = useTheme();
  return (
    <FlatList
      data={places}
      keyExtractor={(p) => p.id}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.list}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <ThemedText themeColor="textSecondary" style={styles.center}>
          {empty}
        </ThemedText>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onSelect(item)}
          style={({ pressed }) => [
            styles.placeRow,
            { backgroundColor: theme.backgroundElement },
            cardShadow(theme),
            pressed && styles.pressed,
          ]}>
          <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
            <Icon name={item.type} size={18} color={theme.onAccentSoft} />
          </View>
          <View style={styles.flex}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {item.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {[
                item.status === 'wishlist' ? 'kívánságlista' : null,
                item.address,
                item.district ? `${item.district}. ker.` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </ThemedText>
          </View>
          <Icon name="add" size={18} color={theme.accent} />
        </Pressable>
      )}
    />
  );
}

function useSearch(places: Place[]) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = fold(query.trim());
    return places
      .filter((p) => !q || [p.name, p.address, p.cuisine].some((v) => v && fold(v).includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name, 'hu'));
  }, [places, query]);
  const field = (
    <View style={styles.search}>
      <TextField
        label="Keresés"
        value={query}
        onChangeText={setQuery}
        placeholder="Név, cím, konyha…"
        autoCorrect={false}
      />
    </View>
  );
  return { filtered, field };
}

function OwnPlaces({ onSelect }: { onSelect: (o: OptionInput) => void }) {
  const { places } = usePlaces();
  const { filtered, field } = useSearch(places);
  return (
    <PlaceList
      places={filtered}
      onSelect={(p) => onSelect(fromPlace(p))}
      header={field}
      empty="Nincs ilyen hely a listádon."
    />
  );
}

function FriendsPlaces({ onSelect }: { onSelect: (o: OptionInput) => void }) {
  const theme = useTheme();
  const { friends } = useFriends();
  const [friend, setFriend] = useState<Friendship | null>(null);
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { filtered, field } = useSearch(places ?? []);

  async function open(f: Friendship) {
    setFriend(f);
    setPlaces(null);
    setError(null);
    try {
      setPlaces(await getProfilePlaces(f.id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!friend) {
    return (
      <FlatList
        data={friends}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.center}>
            Még nincs barátod.
          </ThemedText>
        }
        renderItem={({ item }) => <ProfileRow profile={item} onPress={() => open(item)} />}
      />
    );
  }

  return (
    <PlaceList
      places={filtered}
      onSelect={(p) => onSelect(fromPlace(p))}
      empty={places === null ? (error ?? 'Betöltés…') : 'Nincs ilyen hely a listáján.'}
      header={
        <View style={styles.friendHeader}>
          <Pressable onPress={() => setFriend(null)} hitSlop={8}>
            <ThemedText style={{ color: theme.accent }}>‹ Barátok</ThemedText>
          </Pressable>
          <ThemedText type="smallBold">{displayName(friend)} helyei</ThemedText>
          {field}
        </View>
      }
    />
  );
}

function NewPlace({ onSelect }: { onSelect: (o: OptionInput) => void }) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<GeocodeResult | null>(null);
  const [results, setResults] = useState<GeocodeResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    if (!address.trim()) return;
    setSearching(true);
    try {
      setResults(await geocodeAddress(address));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function add() {
    if (!name.trim()) {
      setError('Add meg a hely nevét.');
      return;
    }
    onSelect({
      name: name.trim(),
      address: address.trim() || location?.address || null,
      district: location?.district ?? districtHint(address),
      lat: location?.lat ?? null,
      lng: location?.lng ?? null,
    });
  }

  return (
    <FlatList
      data={[]}
      renderItem={() => null}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.newForm}>
          <TextField
            label="Név *"
            value={name}
            onChangeText={setName}
            placeholder="pl. Szimpla Kert"
          />
          <TextField
            label="Cím"
            value={address}
            onChangeText={(t) => {
              setAddress(t);
              setResults(null);
            }}
            placeholder="pl. Kazinczy utca 14, 1075"
            returnKeyType="search"
            onSubmitEditing={search}
          />
          <View style={styles.inline}>
            <View style={styles.flex}>
              <Button
                title="Cím keresése"
                icon="search"
                variant="secondary"
                onPress={search}
                loading={searching}
              />
            </View>
            <View style={styles.flex}>
              <Button title="Térképen"
                icon="pin" variant="secondary" onPress={() => setPickerOpen(true)} />
            </View>
          </View>
          {results ? (
            <View style={[styles.results, { backgroundColor: theme.backgroundElement }]}>
              {results.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Nincs találat. Próbáld pontosabban, vagy jelöld ki a térképen.
                </ThemedText>
              ) : (
                results.map((r, i) => (
                  <Pressable
                    key={`${r.lat},${r.lng},${i}`}
                    onPress={() => {
                      setLocation(r);
                      setResults(null);
                    }}>
                    <ThemedText type="small">{r.label}</ThemedText>
                  </Pressable>
                ))
              )}
            </View>
          ) : null}
          <ThemedText type="small" themeColor="textSecondary">
            {location
              ? `Helyszín: ${location.label}`
              : 'A helyszín nem kötelező, de így térképen is látszik.'}
          </ThemedText>
          <FormError message={error} />
          <Button title="Hozzáadás" onPress={add} />
          <LocationPicker
            visible={pickerOpen}
            initial={location ? { lat: location.lat, lng: location.lng } : null}
            onCancel={() => setPickerOpen(false)}
            onConfirm={(r) => {
              setPickerOpen(false);
              setLocation(r);
              if (!address.trim() && r.address) setAddress(r.address);
            }}
          />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  title: {
    fontSize: 17,
  },
  segment: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  list: {
    gap: Spacing.two,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  search: {
    marginBottom: Spacing.two,
  },
  center: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendHeader: {
    gap: Spacing.two,
  },
  newForm: {
    gap: Spacing.three,
  },
  inline: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  results: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
});
