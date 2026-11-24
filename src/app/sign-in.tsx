import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, FormError, TextField } from '@/components/form';
import { FormScreen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { authErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

const PASSWORD_MIN = 8;

type Mode = 'signIn' | 'signUp';

export default function SignInScreen() {
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isSignUp = mode === 'signUp';

  function switchMode() {
    setMode(isSignUp ? 'signIn' : 'signUp');
    setError(null);
    setInfo(null);
    setPassword2('');
  }

  async function submit() {
    setError(null);
    setInfo(null);
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Add meg az e-mail-címet és a jelszót.');
      return;
    }
    if (isSignUp) {
      if (password.length < PASSWORD_MIN) {
        setError(`A jelszó legalább ${PASSWORD_MIN} karakter legyen.`);
        return;
      }
      if (password !== password2) {
        setError('A két jelszó nem egyezik.');
        return;
      }
    }

    setBusy(true);
    try {
      if (isSignUp) {
        const { data, error: err } = await supabase.auth.signUp({ email: cleanEmail, password });
        if (err) return setError(authErrorMessage(err));
        // Ha be van kapcsolva az e-mail-megerősítés, még nincs munkamenet.
        if (!data.session) {
          setInfo('Elküldtünk egy megerősítő e-mailt. A linkre kattintás után be tudsz lépni.');
          setMode('signIn');
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (err) setError(authErrorMessage(err));
      }
      // Sikeres belépéskor a navigáció magától átvált (lásd _layout.tsx).
    } catch (e) {
      setError(authErrorMessage(e as Error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormScreen>
      <View style={styles.header}>
        <ThemedText style={styles.logo}>🍽️</ThemedText>
        <ThemedText type="subtitle">MyDiningMap</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          {isSignUp ? 'Hozd létre a fiókodat' : 'Lépj be a fiókodba'}
        </ThemedText>
      </View>

      <TextField
        label="E-mail-cím"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="nev@pelda.hu"
      />
      <TextField
        label="Jelszó"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        textContentType={isSignUp ? 'newPassword' : 'password'}
        placeholder={isSignUp ? `Legalább ${PASSWORD_MIN} karakter` : undefined}
        onSubmitEditing={isSignUp ? undefined : submit}
      />
      {isSignUp ? (
        <TextField
          label="Jelszó még egyszer"
          value={password2}
          onChangeText={setPassword2}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          onSubmitEditing={submit}
        />
      ) : null}

      <FormError message={error} />
      {info ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {info}
        </ThemedText>
      ) : null}

      <Button title={isSignUp ? 'Regisztráció' : 'Belépés'} onPress={submit} loading={busy} />
      <Button
        title={isSignUp ? 'Már van fiókom – belépés' : 'Még nincs fiókom – regisztráció'}
        onPress={switchMode}
        variant="secondary"
        disabled={busy}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  logo: {
    fontSize: 56,
    lineHeight: 64,
  },
  center: {
    textAlign: 'center',
  },
});
