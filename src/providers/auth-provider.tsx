import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  visibility: 'private' | 'public';
};

type AuthState = {
  /** Amíg igaz, még nem tudjuk, be van-e lépve a felhasználó (indításkor). */
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  /** Újratölti a profilt az adatbázisból (pl. felhasználónév mentése után). */
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, visibility')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.warn('Profil betöltése sikertelen', error);
    return null;
  }
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  // A profilt a felhasználó azonosítójával együtt tároljuk, így kijelentkezéskor
  // vagy fiókváltáskor a régi profil nem „szivárog át”.
  const [loadedProfile, setLoadedProfile] = useState<{
    userId: string;
    profile: Profile | null;
  } | null>(null);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoaded(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Ha változik a bejelentkezett felhasználó, betöltjük a profilját.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchProfile(userId).then((profile) => {
      if (!cancelled) setLoadedProfile({ userId, profile });
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const profile = userId && loadedProfile?.userId === userId ? loadedProfile.profile : null;
  const loading = !sessionLoaded || (userId !== null && loadedProfile?.userId !== userId);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const fresh = await fetchProfile(userId);
    setLoadedProfile({ userId, profile: fresh });
  }, [userId]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ loading, session, profile, refreshProfile, signOut }),
    [loading, session, profile, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth csak AuthProvideren belül használható.');
  return ctx;
}
