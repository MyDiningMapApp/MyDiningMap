import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Segmented } from '@/components/chips';
import { PlaceRow } from '@/components/place-row';
import { RelationshipButton } from '@/components/relationship-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSignedUrls } from '@/hooks/use-signed-urls';
import { fetchProfilePhotos, firstThumbPaths, type PlacePhoto } from '@/lib/photos';
import type { Place, PlaceStatus } from '@/lib/places';
import {
  canViewPlaces,
  displayName,
  getProfilePlaces,
  searchProfile,
  type ProfileSummary,
  type Relationship,
} from '@/lib/social';

/** Más felhasználó profilja és – ha látható – a helyei. */
export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const [profile, setProfile] = useState<ProfileSummary | null | undefined>(undefined);
  const [places, setPlaces] = useState<Place[]>([]);
  const [photos, setPhotos] = useState<Record<string, PlacePhoto[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PlaceStatus>('visited');

  const load = useCallback(async () => {
    try {
      const p = await searchProfile(username);
      setProfile(p);
      const viewable = !!p && canViewPlaces(p);
      const [pl, ph] = viewable
        ? await Promise.all([getProfilePlaces(p!.id), fetchProfilePhotos(p!.id)])
        : [[], {}];
      setPlaces(pl);
      setPhotos(ph);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [username]);

  // Betöltés a képernyő megnyitásakor (és visszatéréskor).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const thumbPaths = useMemo(() => firstThumbPaths(photos), [photos]);
  const thumbUrls = useSignedUrls(Object.values(thumbPaths));

  const visible = useMemo(() => places.filter((p) => p.status === status), [places, status]);
  const counts = useMemo(
    () => ({
      visited: places.filter((p) => p.status === 'visited').length,
      wishlist: places.filter((p) => p.status === 'wishlist').length,
    }),
    [places],
  );

  function onRelationshipChange(relationship: Relationship) {
    if (!profile) return;
    setProfile({ ...profile, relationship });
    load();
  }

  if (profile === undefined) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: `@${username}` }} />
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : <ActivityIndicator />}
      </ThemedView>
    );
  }
  if (profile === null) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: `@${username}` }} />
        <ThemedText themeColor="textSecondary">Nincs ilyen felhasználó.</ThemedText>
      </ThemedView>
    );
  }

  const viewable = canViewPlaces(profile);
  const header = (
    <View style={styles.header}>
      <View style={styles.identity}>
        <Avatar name={displayName(profile)} size={64} />
        <ThemedText type="subtitle" style={styles.centerText}>
          {displayName(profile)}
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          {profile.display_name?.trim() ? `@${profile.username} · ` : ''}
          {profile.visibility === 'public' ? 'Publikus' : 'Privát'} profil
        </ThemedText>
      </View>
      <RelationshipButton
        profile={profile}
        relationship={profile.relationship}
        onChange={onRelationshipChange}
      />
      {viewable ? (
        <Segmented<PlaceStatus>
          options={[
            { value: 'visited', label: `Kipróbált (${counts.visited})` },
            {
              value: 'wishlist',
              label: `♡ Kívánságlista (${counts.wishlist})`,
            },
          ]}
          value={status}
          onChange={setStatus}
        />
      ) : (
        <ThemedView type="backgroundElement" style={styles.notice}>
          <ThemedText style={styles.centerText}>
            🔒 Ez a profil privát.{' '}
            {profile.relationship === 'outgoing'
              ? 'Ha elfogadja a jelölésedet, látni fogod a helyeit.'
              : profile.relationship === 'incoming'
                ? 'Fogadd el a jelölését, és láthatjátok egymás helyeit.'
                : 'Jelöld be barátnak, hogy lásd a helyeit.'}
          </ThemedText>
        </ThemedView>
      )}
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
    </View>
  );

  const openPlace = (id: string) =>
    router.push({
      pathname: '/user/place/[id]',
      params: { id, owner: profile.username },
    });

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: `@${profile.username}` }} />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={viewable ? visible : []}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PlaceRow
            place={item}
            onPress={() => openPlace(item.id)}
            hasPhoto={!!thumbPaths[item.id]}
            thumbUri={thumbPaths[item.id] ? thumbUrls[thumbPaths[item.id]] : undefined}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          viewable ? (
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              {status === 'visited' ? 'Még nincs kipróbált helye.' : 'A kívánságlistája üres.'}
            </ThemedText>
          ) : undefined
        }
        contentContainerStyle={styles.list}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  identity: {
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  notice: {
    padding: Spacing.three,
    borderRadius: 14,
  },
  list: {
    gap: Spacing.two,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  error: {
    color: '#D93025',
  },
});
