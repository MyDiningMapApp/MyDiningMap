/** Barátok, keresés és más felhasználók helyei – az adatbázis-függvények hívása. */
import type { Place } from '@/lib/places';
import { supabase } from '@/lib/supabase';

/** A bejelentkezett felhasználó kapcsolata egy másik felhasználóval. */
export type Relationship = 'self' | 'friends' | 'outgoing' | 'incoming' | 'none';

export type ProfileSummary = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  visibility: 'private' | 'public';
  relationship: Relationship;
};

export type Friendship = ProfileSummary & { since: string };

const NETWORK_ERROR = 'Nem sikerült elérni a szervert. Ellenőrizd az internetkapcsolatot.';

/** Profil pontos felhasználónévre; null, ha nincs ilyen. */
export async function searchProfile(username: string): Promise<ProfileSummary | null> {
  const { data, error } = await supabase.rpc('search_profile', { p_username: username });
  if (error) throw new Error(NETWORK_ERROR);
  return ((data as ProfileSummary[] | null) ?? [])[0] ?? null;
}

export async function listFriendships(): Promise<Friendship[]> {
  const { data, error } = await supabase.rpc('list_friendships');
  if (error) throw new Error(NETWORK_ERROR);
  return (data as Friendship[] | null) ?? [];
}

/** Egy felhasználó helyei, ha láthatók (saját, barát, publikus); különben üres lista. */
export async function getProfilePlaces(userId: string): Promise<Place[]> {
  const { data, error } = await supabase.rpc('get_profile_places', { p_user: userId });
  if (error) throw new Error(NETWORK_ERROR);
  const places = (data as Place[] | null) ?? [];
  places.forEach((p) => placeCache.set(p.id, p));
  return places;
}

/** A más felhasználóktól betöltött helyek, hogy az adatlap újratöltés nélkül megnyíljon. */
const placeCache = new Map<string, Place>();
export function getCachedPlace(id: string): Place | undefined {
  return placeCache.get(id);
}

async function callRelationship(fn: string, args: Record<string, unknown>): Promise<Relationship> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    // Az adatbázis magyar hibaüzenetei (pl. „Saját magadat nem jelölheted be.”) mehetnek tovább.
    throw new Error(error.code === 'P0001' && error.message ? error.message : NETWORK_ERROR);
  }
  return data as Relationship;
}

export const sendFriendRequest = (userId: string) =>
  callRelationship('send_friend_request', { p_user: userId });

export const respondFriendRequest = (userId: string, accept: boolean) =>
  callRelationship('respond_friend_request', { p_user: userId, p_accept: accept });

/** Elküldött jelölés visszavonása vagy barátság megszüntetése. */
export const removeFriendship = (userId: string) =>
  callRelationship('remove_friendship', { p_user: userId });

/** Megjelenítendő név: a megjelenített név, ha van, különben @felhasználónév. */
export function displayName(p: Pick<ProfileSummary, 'username' | 'display_name'>): string {
  return p.display_name?.trim() || `@${p.username}`;
}

/** Láthatók-e a felhasználó helyei: saját, barát vagy publikus profil. (Az adatbázis is ezt ellenőrzi.) */
export function canViewPlaces(p: Pick<ProfileSummary, 'relationship' | 'visibility'>): boolean {
  return p.relationship === 'self' || p.relationship === 'friends' || p.visibility === 'public';
}

/** Barátlista szétválogatása a Barátok fülhöz. */
export function groupFriendships(list: Friendship[]) {
  return {
    incoming: list.filter((f) => f.relationship === 'incoming'),
    outgoing: list.filter((f) => f.relationship === 'outgoing'),
    friends: list.filter((f) => f.relationship === 'friends'),
  };
}
