import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, TextField } from '@/components/form';
import { ProfileRow } from '@/components/profile-row';
import { RelationshipButton } from '@/components/relationship-button';
import { TabHeader } from '@/components/tab-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { searchProfile, type ProfileSummary } from '@/lib/social';
import { normalizeUsername } from '@/lib/username';
import { useFriends } from '@/providers/friends-provider';

const openProfile = (username: string) =>
  router.push({ pathname: '/user/[username]', params: { username } });

export default function FriendsScreen() {
  const theme = useTheme();
  const { friends, incoming, outgoing, loading, error, reload } = useFriends();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<ProfileSummary | null | undefined>(undefined);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function search() {
    const username = normalizeUsername(query);
    if (!username) return;
    setSearching(true);
    setSearchError(null);
    try {
      setResult(await searchProfile(username));
    } catch (e) {
      setSearchError((e as Error).message);
      setResult(undefined);
    } finally {
      setSearching(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <TabHeader
          actionLabel="Új esemény létrehozása"
          onAction={() => router.push('/event/new')}
        />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <View style={styles.section}>
            <TextField
              label="Keresés felhasználónévre"
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                setResult(undefined);
              }}
              placeholder="pl. marcell"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={search}
            />
            <Button
              title="Keresés"
              variant="secondary"
              onPress={search}
              loading={searching}
              disabled={!normalizeUsername(query)}
            />
            <ThemedText type="small" themeColor="textSecondary">
              A felhasználónevet pontosan kell beírni.
            </ThemedText>
            {searchError ? (
              <ThemedText type="small" style={[styles.error, { color: theme.danger }]}>
                {searchError}
              </ThemedText>
            ) : null}
            {result === null ? (
              <ThemedText themeColor="textSecondary">
                Nincs ilyen felhasználó: @{normalizeUsername(query)}
              </ThemedText>
            ) : null}
            {result ? (
              <ProfileRow profile={result} onPress={() => openProfile(result.username)}>
                {result.relationship === 'self' ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    Ez te vagy.
                  </ThemedText>
                ) : (
                  <RelationshipButton
                    profile={result}
                    relationship={result.relationship}
                    onChange={(relationship) => setResult({ ...result, relationship })}
                  />
                )}
              </ProfileRow>
            ) : null}
          </View>

          {error ? (
            <ThemedText type="small" style={[styles.error, { color: theme.danger }]}>
              {error} Húzd le az oldalt az újrapróbáláshoz.
            </ThemedText>
          ) : null}

          {incoming.length > 0 ? (
            <View style={styles.section}>
              <ThemedText type="smallBold">Bejövő jelölések ({incoming.length})</ThemedText>
              {incoming.map((f) => (
                <ProfileRow key={f.id} profile={f} onPress={() => openProfile(f.username)}>
                  <RelationshipButton profile={f} relationship="incoming" />
                </ProfileRow>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <ThemedText type="smallBold">Barátaim ({friends.length})</ThemedText>
            {friends.map((f) => (
              <ProfileRow key={f.id} profile={f} onPress={() => openProfile(f.username)} />
            ))}
            {!loading && friends.length === 0 ? (
              <ThemedText themeColor="textSecondary">
                Még nincs barátod. Keress rá valakire a felhasználóneve alapján, és jelöld be!
              </ThemedText>
            ) : null}
          </View>

          {outgoing.length > 0 ? (
            <View style={styles.section}>
              <ThemedText type="smallBold">Elküldött jelölések ({outgoing.length})</ThemedText>
              {outgoing.map((f) => (
                <ProfileRow key={f.id} profile={f} onPress={() => openProfile(f.username)}>
                  <RelationshipButton profile={f} relationship="outgoing" />
                </ProfileRow>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  error: {
    fontWeight: 600,
  },
});
