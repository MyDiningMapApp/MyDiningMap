import { usernameErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

export type ProfilePatch = {
  username?: string;
  display_name?: string | null;
  visibility?: 'private' | 'public';
};

/** Saját profil módosítása; hibánál magyar üzenettel dob. */
export async function updateOwnProfile(userId: string, patch: ProfilePatch): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (!error) return;
  if (error.code === '23514' && error.message.includes('display_name')) {
    throw new Error('A megjelenített név legfeljebb 60 karakter lehet.');
  }
  if (patch.username) throw new Error(usernameErrorMessage(error));
  throw new Error('Nem sikerült menteni. Próbáld újra.');
}

export const DISPLAY_NAME_MAX = 60;
