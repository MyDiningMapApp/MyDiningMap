import './local-storage';

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Hiányzik az EXPO_PUBLIC_SUPABASE_URL vagy az EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY a .env fájlból.',
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    // A bejelentkezés az app újraindítása után is megmarad (expo-sqlite alapú localStorage).
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// A tokenfrissítés csak akkor fusson, amikor az app előtérben van.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
