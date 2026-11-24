import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

export default function ProfileScreen() {
  const { session, profile, signOut } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="subtitle">@{profile?.username}</ThemedText>
          <ThemedText themeColor="textSecondary">{session?.user.email}</ThemedText>
        </View>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Profil láthatósága</ThemedText>
          <ThemedText themeColor="textSecondary">
            {profile?.visibility === 'public' ? 'Publikus' : 'Privát'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            A láthatóság beállítása és a barátok a következő szakaszban jönnek.
          </ThemedText>
        </ThemedView>

        <Button title="Kijelentkezés" onPress={signOut} variant="secondary" />
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
  safeArea: {
    flex: 1,
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.four,
  },
  card: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: 16,
  },
});
