import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { EventsProvider } from '@/providers/events-provider';
import { FriendsProvider } from '@/providers/friends-provider';
import { PlacesProvider } from '@/providers/places-provider';

// Az indítóképernyő addig marad kint, amíg ki nem derül, be van-e lépve a felhasználó.
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { loading, session, profile } = useAuth();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  const signedIn = !!session;
  const hasUsername = !!profile?.username;

  return (
    <PlacesProvider>
      <FriendsProvider>
        <EventsProvider>
          <Stack screenOptions={{ headerShown: false, headerBackTitle: 'Vissza' }}>
            <Stack.Protected guard={!signedIn}>
              <Stack.Screen name="sign-in" />
            </Stack.Protected>
            <Stack.Protected guard={signedIn && !hasUsername}>
              <Stack.Screen name="choose-username" />
            </Stack.Protected>
            <Stack.Protected guard={signedIn && hasUsername}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="profile" options={{ headerShown: true, title: 'Profil' }} />
              <Stack.Screen name="place/[id]" options={{ headerShown: true }} />
              <Stack.Screen name="event/[id]" options={{ headerShown: true, title: '' }} />
              <Stack.Screen
                name="event/new"
                options={{ headerShown: true, presentation: 'modal', title: 'Új esemény' }}
              />
              <Stack.Screen name="user/[username]" options={{ headerShown: true }} />
              <Stack.Screen name="user/place/[id]" options={{ headerShown: true }} />
              <Stack.Screen
                name="place/edit"
                options={{ headerShown: true, presentation: 'modal' }}
              />
            </Stack.Protected>
          </Stack>
        </EventsProvider>
      </FriendsProvider>
    </PlacesProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
