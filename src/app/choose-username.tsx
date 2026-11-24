import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, FormError, TextField } from '@/components/form';
import { FormScreen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { usernameErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { normalizeUsername, validateUsername } from '@/lib/username';
import { useAuth } from '@/providers/auth-provider';

export default function ChooseUsernameScreen() {
  const { session, refreshProfile, signOut } = useAuth();
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const username = normalizeUsername(value);
  const formatError = validateUsername(username);

  async function save() {
    setTouched(true);
    setError(null);
    if (formatError || !session) return;
    setBusy(true);
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', session.user.id);
      if (err) {
        setError(usernameErrorMessage(err));
        return;
      }
      // A profil frissülése után a navigáció magától átvált a fő képernyőkre.
      await refreshProfile();
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormScreen>
      <View style={styles.header}>
        <ThemedText type="subtitle">Válassz felhasználónevet</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          Erre a névre kereshetnek rá a barátaid. Később is megváltoztathatod.
        </ThemedText>
      </View>

      <TextField
        label="Felhasználónév"
        value={value}
        onChangeText={(t) => {
          setValue(t);
          setTouched(true);
          setError(null);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username-new"
        textContentType="username"
        placeholder="pl. marcell"
        error={touched && value.length > 0 ? formatError : null}
        onSubmitEditing={save}
      />
      {username && !formatError ? (
        <ThemedText type="small" themeColor="textSecondary">
          Így fog megjelenni: @{username}
        </ThemedText>
      ) : null}

      <FormError message={error} />

      <Button title="Mentés" onPress={save} loading={busy} disabled={!!formatError} />
      <Button title="Kijelentkezés" onPress={signOut} variant="secondary" disabled={busy} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  center: {
    textAlign: 'center',
  },
});
