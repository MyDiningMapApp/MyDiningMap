import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Segmented } from '@/components/chips';
import { Button, FormError, TextField } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { DISPLAY_NAME_MAX, updateOwnProfile } from '@/lib/profile';
import { normalizeUsername, validateUsername } from '@/lib/username';
import { useAuth } from '@/providers/auth-provider';
import { useFriends } from '@/providers/friends-provider';

type Visibility = 'private' | 'public';

export default function ProfileScreen() {
  const { session, profile, refreshProfile, signOut } = useAuth();
  const { friends } = useFriends();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [saving, setSaving] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!profile || !session) return null;

  const normalized = normalizeUsername(username);
  const usernameError = validateUsername(normalized);
  const cleanDisplayName = displayName.trim();
  const changed =
    normalized !== profile.username || cleanDisplayName !== (profile.display_name ?? '');

  async function saveDetails() {
    if (usernameError) {
      setError(usernameError);
      return;
    }
    if (cleanDisplayName.length > DISPLAY_NAME_MAX) {
      setError(`A megjelenített név legfeljebb ${DISPLAY_NAME_MAX} karakter lehet.`);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateOwnProfile(session!.user.id, {
        username: normalized,
        display_name: cleanDisplayName || null,
      });
      await refreshProfile();
      setUsername(normalized);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function changeVisibility(visibility: Visibility) {
    if (visibility === profile!.visibility) return;
    setSavingVisibility(true);
    try {
      await updateOwnProfile(session!.user.id, { visibility });
      await refreshProfile();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingVisibility(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex} edges={[]}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Avatar name={profile.display_name || profile.username || '?'} size={72} />
            <ThemedText type="subtitle" style={styles.center}>
              {profile.display_name || `@${profile.username}`}
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              {profile.display_name ? `@${profile.username} · ` : ''}
              {friends.length} barát
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {session.user.email}
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Profil láthatósága</ThemedText>
            <Segmented<Visibility>
              onCard
              options={[
                { value: 'private', label: '🔒 Privát' },
                { value: 'public', label: '🌍 Publikus' },
              ]}
              value={profile.visibility}
              onChange={changeVisibility}
            />
            <ThemedText type="small" themeColor="textSecondary">
              {savingVisibility
                ? 'Mentés…'
                : profile.visibility === 'public'
                  ? 'Bárki, aki pontosan rákeres a felhasználónevedre, láthatja a kipróbált helyeidet és a kívánságlistádat.'
                  : 'A helyeidet csak a barátaid látják. Mások a keresőben csak a nevedet látják.'}
            </ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Adataim</ThemedText>
            <TextField
              label="Megjelenített név"
              value={displayName}
              onChangeText={(t) => {
                setDisplayName(t);
                setSaved(false);
              }}
              placeholder="pl. Kovács Anna (nem kötelező)"
              maxLength={DISPLAY_NAME_MAX}
              onCard
            />
            <TextField
              label="Felhasználónév"
              value={username}
              onChangeText={(t) => {
                setUsername(t);
                setSaved(false);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              onCard
              error={username.length > 0 && normalized !== profile.username ? usernameError : null}
            />
            <ThemedText type="small" themeColor="textSecondary">
              Erre a névre kereshetnek rá a barátaid. Ha megváltoztatod, a régi neved felszabadul.
            </ThemedText>
            <FormError message={error} />
            {saved && !changed ? (
              <ThemedText type="small" themeColor="textSecondary">
                ✓ Elmentve
              </ThemedText>
            ) : null}
            <Button title="Mentés" onPress={saveDetails} loading={saving} disabled={!changed} />
          </ThemedView>

          <Button title="Kijelentkezés" onPress={signOut} variant="secondary" />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
  },
});
