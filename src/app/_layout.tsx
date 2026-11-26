import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { Colors, FontFamily } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { EventsProvider } from '@/providers/events-provider';
import { FriendsProvider } from '@/providers/friends-provider';
import { PlacesProvider } from '@/providers/places-provider';

// Az indítóképernyő addig marad kint, amíg ki nem derül, be van-e lépve a felhasználó.
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { loading: authLoading, session, profile } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  // Ha a betűtípus nem tölthető be, a rendszer betűjével indulunk tovább.
  const loading = authLoading || (!fontsLoaded && !fontError);

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

/** A navigáció (fejlécek, háttér) színei a Menta témából. */
function navigationTheme(dark: boolean) {
  const base = dark ? DarkTheme : DefaultTheme;
  const c = Colors[dark ? 'dark' : 'light'];
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.accent,
      background: c.background,
      card: c.background,
      text: c.text,
      border: c.border,
    },
    fonts: {
      regular: { fontFamily: FontFamily.regular, fontWeight: '400' as const },
      medium: { fontFamily: FontFamily.medium, fontWeight: '500' as const },
      bold: { fontFamily: FontFamily.bold, fontWeight: '700' as const },
      heavy: { fontFamily: FontFamily.extrabold, fontWeight: '800' as const },
    },
  };
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={navigationTheme(colorScheme === 'dark')}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
