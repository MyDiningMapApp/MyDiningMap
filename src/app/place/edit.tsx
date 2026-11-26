import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { Chip, ChipGroup, Segmented } from '@/components/chips';
import { Button, FormError, TextField } from '@/components/form';
import { LocationPicker } from '@/components/location-picker';
import { PhotoStrip } from '@/components/photo-strip';
import { RatingInput } from '@/components/rating-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { cardShadow, Spacing } from '@/constants/theme';
import { useSignedUrls } from '@/hooks/use-signed-urls';
import { useTheme } from '@/hooks/use-theme';
import { showError } from '@/lib/confirm';
import { geocodeAddress, type GeocodeResult } from '@/lib/geocode';
import { MAX_PHOTOS, remainingSlots, type LocalPhoto } from '@/lib/photos';
import {
  DISTRICTS,
  PLACE_TYPE_KEYS,
  PLACE_TYPES,
  PRICE_LABELS,
  cuisineOptions,
  districtHint,
  draftFromPlace,
  draftToInput,
  emptyDraft,
  fold,
  type PlaceDraft,
  type PlaceStatus,
} from '@/lib/places';
import { usePlaces } from '@/providers/places-provider';

type Params = { id?: string; status?: PlaceStatus; markVisited?: string };

export default function EditPlaceScreen() {
  const params = useLocalSearchParams<Params>();
  const { getPlace, places, createPlace, updatePlace, photosByPlace, addPhotos, removePhotos } =
    usePlaces();
  const existing = params.id ? getPlace(params.id) : undefined;
  const theme = useTheme();

  const [draft, setDraft] = useState<PlaceDraft>(() => {
    if (existing) {
      const d = draftFromPlace(existing);
      // „✓ Voltam itt”: a kívánságlistás hely átkerül a kipróbáltak közé.
      return params.markVisited ? { ...d, status: 'visited' } : d;
    }
    return emptyDraft(params.status === 'wishlist' ? 'wishlist' : 'visited');
  });
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  // Fotók: a már feltöltöttek (a törlésre jelöltek nélkül) és az újonnan kiválasztottak.
  const [pendingPhotos, setPendingPhotos] = useState<LocalPhoto[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const savedPhotos = useMemo(
    () => (existing ? (photosByPlace[existing.id] ?? []) : []).filter((p) => !removedIds.includes(p.id)),
    [existing, photosByPlace, removedIds],
  );
  const savedThumbs = useSignedUrls(savedPhotos.map((p) => p.thumb_path));
  const freeSlots = remainingSlots(savedPhotos.length, pendingPhotos.length);
  const [error, setError] = useState<string | null>(null);

  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GeocodeResult[] | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const set = (patch: Partial<PlaceDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const visited = draft.status === 'visited';

  const cuisineSuggestions = useMemo(() => {
    const q = fold(draft.cuisine.trim());
    return cuisineOptions(places)
      .filter((c) => !q || (fold(c).includes(q) && fold(c) !== q))
      .slice(0, 12);
  }, [places, draft.cuisine]);

  async function searchAddress() {
    const q = draft.address.trim();
    if (!q) {
      setError('Írd be a címet, vagy jelöld ki a helyet a térképen.');
      return;
    }
    setError(null);
    setSearching(true);
    try {
      const found = await geocodeAddress(q);
      setResults(found);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function applyLocation(r: GeocodeResult) {
    setResults(null);
    setDraft((d) => ({
      ...d,
      lat: r.lat,
      lng: r.lng,
      address: d.address.trim() ? d.address : (r.address ?? d.address),
      district: r.district ?? districtHint(d.address) ?? d.district,
    }));
  }

  async function pickPhotos() {
    if (freeSlots === 0) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: freeSlots,
      orderedSelection: true,
      quality: 1,
    });
    if (res.canceled) return;
    const picked = res.assets.slice(0, freeSlots).map((a, i) => ({
      key: `${a.assetId ?? a.uri}-${Date.now()}-${i}`,
      uri: a.uri,
      width: a.width,
      height: a.height,
    }));
    setPendingPhotos((list) => [...list, ...picked]);
  }

  function removePhoto(key: string) {
    if (pendingPhotos.some((p) => p.key === key)) {
      setPendingPhotos((list) => list.filter((p) => p.key !== key));
    } else {
      setRemovedIds((ids) => [...ids, key]);
    }
  }

  async function save() {
    const result = draftToInput(draft);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setError(null);
    setSaving(true);
    let placeId: string;
    try {
      placeId = existing
        ? (await updatePlace(existing.id, result.input)).id
        : (await createPlace(result.input)).id;
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
      return;
    }

    // A hely már el van mentve; a fotókkal kapcsolatos hiba ezt nem vonja vissza.
    try {
      const toRemove = (existing ? (photosByPlace[existing.id] ?? []) : []).filter((p) =>
        removedIds.includes(p.id),
      );
      if (toRemove.length > 0) {
        setProgress('Fotók törlése…');
        await removePhotos(toRemove);
      }
      if (pendingPhotos.length > 0) {
        await addPhotos(placeId, pendingPhotos, (done, total) =>
          setProgress(`Fotók feltöltése: ${Math.min(done + 1, total)}/${total}…`),
        );
      }
    } catch (e) {
      showError(`A hely elmentve, de a fotóknál hiba történt: ${(e as Error).message}`);
    } finally {
      setProgress(null);
      setSaving(false);
    }
    router.back();
  }

  const title = existing ? (params.markVisited ? 'Voltam itt!' : 'Hely szerkesztése') : 'Új hely';

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen
        options={{
          title,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ThemedText style={{ color: theme.accent }}>Mégse</ThemedText>
            </Pressable>
          ),
          headerRight: () =>
            saving ? (
              <ActivityIndicator />
            ) : (
              <Pressable onPress={save} hitSlop={12}>
                <ThemedText style={{ color: theme.accent, fontWeight: 700 }}>Mentés</ThemedText>
              </Pressable>
            ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <Segmented<PlaceStatus>
            options={[
              { value: 'visited', label: 'Kipróbáltam', icon: 'check' },
              { value: 'wishlist', label: 'Kívánságlista', icon: 'heart' },
            ]}
            value={draft.status}
            onChange={(v) => set({ status: v })}
          />

          <TextField
            label="Név *"
            value={draft.name}
            onChangeText={(t) => set({ name: t })}
            placeholder="pl. Mori Ramen"
            autoFocus={!existing}
          />

          <Section label="Típus">
            <ChipGroup
              options={PLACE_TYPE_KEYS.map((k) => ({
                value: k,
                label: PLACE_TYPES[k].label,
                icon: k,
              }))}
              value={draft.type}
              onChange={(v) => set({ type: v })}
            />
          </Section>

          <Section label="Helyszín">
            <View style={styles.inline}>
              <View style={styles.flex}>
                <TextField
                  label="Cím"
                  value={draft.address}
                  onChangeText={(t) => {
                    const district = districtHint(t);
                    set(district ? { address: t, district } : { address: t });
                  }}
                  placeholder="pl. Akácfa utca 55, 1073"
                  returnKeyType="search"
                  onSubmitEditing={searchAddress}
                />
              </View>
            </View>
            <View style={styles.inline}>
              <View style={styles.flex}>
                <Button
                  title="Cím keresése"
                  icon="search"
                  variant="secondary"
                  onPress={searchAddress}
                  loading={searching}
                />
              </View>
              <View style={styles.flex}>
                <Button
                  title="Térképen"
                  icon="pin"
                  variant="secondary"
                  onPress={() => {
                    setResults(null);
                    setPickerOpen(true);
                  }}
                />
              </View>
            </View>

            {results ? (
              <View
                style={[
                  styles.results,
                  { backgroundColor: theme.backgroundElement },
                  cardShadow(theme),
                ]}>
                {results.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    Nincs találat. Próbáld pontosabban, vagy jelöld ki a térképen.
                  </ThemedText>
                ) : (
                  <>
                    {results.map((r, i) => {
                      const hint = districtHint(draft.address);
                      const mismatch = !!hint && !!r.district && r.district !== hint;
                      return (
                        <Pressable key={`${r.lat},${r.lng},${i}`} onPress={() => applyLocation(r)}>
                          <ThemedText type="small">{r.label}</ThemedText>
                          {mismatch ? (
                            <ThemedText type="small" style={[styles.warning, { color: theme.ratingMidInk }]}>
                              Figyelem: ez nem a megadott kerületben ({hint}.) van.
                            </ThemedText>
                          ) : null}
                        </Pressable>
                      );
                    })}
                    <ThemedText type="small" themeColor="textSecondary">
                      Nem ez az? Budapesten sok azonos nevű utca van: írd a címhez az irányítószámot
                      (pl. 1073) vagy a kerületet (pl. VII. ker.), vagy jelöld ki a térképen.
                    </ThemedText>
                  </>
                )}
              </View>
            ) : null}

            <ThemedText type="small" themeColor="textSecondary">
              {draft.lat != null
                ? 'Helyszín megadva, megjelenik a térképen.'
                : 'Még nincs helyszín: keresd meg a címet, vagy jelöld ki a térképen.'}
            </ThemedText>
          </Section>

          <Section label={`Kerület${draft.district ? `: ${draft.district}.` : ''}`}>
            <ChipGroup<string | null>
              scroll
              allowDeselect
              emptyValue={null}
              options={DISTRICTS.map((d) => ({ value: d, label: d }))}
              value={draft.district}
              onChange={(v) => set({ district: v })}
            />
          </Section>

          <View>
            <TextField
              label="Konyha / kínálat"
              value={draft.cuisine}
              onChangeText={(t) => set({ cuisine: t })}
              placeholder="pl. japán, olasz, kovászos kenyér"
              autoCapitalize="none"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestions}
              keyboardShouldPersistTaps="handled">
              {cuisineSuggestions.map((c) => (
                <Chip key={c} label={c} onPress={() => set({ cuisine: c })} />
              ))}
            </ScrollView>
          </View>

          <Section label="Árszint">
            <ChipGroup<number | null>
              allowDeselect
              emptyValue={null}
              options={[1, 2, 3, 4].map((n) => ({ value: n, label: PRICE_LABELS[n] }))}
              value={draft.price}
              onChange={(v) => set({ price: v })}
            />
          </Section>

          {visited ? (
            <>
              <Section label={`Értékelés${draft.rating ? `: ${draft.rating}/10` : ''}`}>
                <RatingInput value={draft.rating} onChange={(v) => set({ rating: v })} />
              </Section>
              <View style={styles.switchRow}>
                <ThemedText>Visszamennék</ThemedText>
                <Switch
                  value={draft.wouldReturn}
                  onValueChange={(v) => set({ wouldReturn: v })}
                  trackColor={{ true: theme.accent }}
                />
              </View>
            </>
          ) : null}

          <TextField
            label="Jegyzet"
            value={draft.notes}
            onChangeText={(t) => set({ notes: t })}
            placeholder="Mit ettél, mi volt jó, kivel mennél…"
            multiline
            style={styles.notes}
          />

          <TextField
            label="Link"
            value={draft.url}
            onChangeText={(t) => set({ url: t })}
            placeholder="pl. Google Maps vagy weboldal"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Section label={`Fotók (${savedPhotos.length + pendingPhotos.length}/${MAX_PHOTOS})`}>
            <PhotoStrip
              items={[
                ...savedPhotos.map((p) => ({ key: p.id, uri: savedThumbs[p.thumb_path] })),
                ...pendingPhotos.map((p) => ({ key: p.key, uri: p.uri })),
              ]}
              onRemove={saving ? undefined : removePhoto}
              onAdd={freeSlots > 0 && !saving ? pickPhotos : undefined}
              addLabel="Galéria"
            />
            {pendingPhotos.length > 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Az új fotók mentéskor töltődnek fel.
              </ThemedText>
            ) : null}
          </Section>

          <FormError message={error} />
          {progress ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.progress}>
              {progress}
            </ThemedText>
          ) : null}
          <Button title="Mentés" onPress={save} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>

      <LocationPicker
        visible={pickerOpen}
        initial={draft.lat != null && draft.lng != null ? { lat: draft.lat, lng: draft.lng } : null}
        onCancel={() => setPickerOpen(false)}
        onConfirm={(r) => {
          setPickerOpen(false);
          applyLocation(r);
        }}
      />
    </ThemedView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  section: {
    gap: Spacing.two,
  },
  inline: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  results: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 12,
  },
  suggestions: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warning: {
    fontWeight: 700,
  },
  progress: {
    textAlign: 'center',
  },
  notes: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
