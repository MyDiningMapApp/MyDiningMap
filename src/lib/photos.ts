/** Fotók a helyekhez: kicsinyítés, feltöltés, aláírt linkek, törlés. */
import { randomUUID } from 'expo-crypto';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { supabase } from '@/lib/supabase';

export const MAX_PHOTOS = 6;
const BUCKET = 'place-photos';
/** A teljes kép hosszabbik oldala (px) és a bélyegkép mérete. */
const FULL_SIZE = 1600;
const THUMB_SIZE = 320;
/** Az aláírt linkek érvényessége (másodperc). */
const URL_TTL = 60 * 60;

export type PlacePhoto = {
  id: string;
  place_id: string;
  owner_id: string;
  path: string;
  thumb_path: string;
  width: number | null;
  height: number | null;
  position: number;
  created_at: string;
};

/** A galériából kiválasztott, még fel nem töltött kép. */
export type LocalPhoto = {
  key: string;
  uri: string;
  width: number;
  height: number;
};

const COLUMNS = 'id, place_id, owner_id, path, thumb_path, width, height, position, created_at';

/** Hány további fotó adható még a helyhez. */
export function remainingSlots(existing: number, pending: number): number {
  return Math.max(0, MAX_PHOTOS - existing - pending);
}

/** Átméretezés úgy, hogy a hosszabbik oldal legfeljebb `max` legyen (kicsinyíteni nem nagyít). */
export function fitSize(width: number, height: number, max: number) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Fotók csoportosítása helyenként, sorrendben. */
export function groupByPlace(photos: PlacePhoto[]): Record<string, PlacePhoto[]> {
  const out: Record<string, PlacePhoto[]> = {};
  for (const p of photos) (out[p.place_id] ??= []).push(p);
  for (const list of Object.values(out)) {
    list.sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
  }
  return out;
}

async function resize(uri: string, width: number, height: number, max: number, compress: number) {
  const size = fitSize(width, height, max);
  const ctx = ImageManipulator.manipulate(uri);
  if (size.width < width) ctx.resize({ width: size.width });
  const ref = await ctx.renderAsync();
  const result = await ref.saveAsync({ compress, format: SaveFormat.JPEG });
  return { uri: result.uri, width: result.width, height: result.height };
}

async function uploadFile(path: string, uri: string) {
  const body = await (await fetch(uri)).arrayBuffer();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error('Nem sikerült feltölteni a fotót.');
}

/** Egy kép kicsinyítése és feltöltése (nagy kép + bélyegkép), majd a sor mentése. */
export async function uploadPhoto(
  ownerId: string,
  placeId: string,
  photo: LocalPhoto,
  position: number,
): Promise<PlacePhoto> {
  const id = randomUUID();
  const base = `${ownerId}/${placeId}/${id}`;
  const path = `${base}.jpg`;
  const thumbPath = `${base}_thumb.jpg`;

  const full = await resize(photo.uri, photo.width, photo.height, FULL_SIZE, 0.7);
  const thumb = await resize(photo.uri, photo.width, photo.height, THUMB_SIZE, 0.6);

  await uploadFile(path, full.uri);
  try {
    await uploadFile(thumbPath, thumb.uri);
    const { data, error } = await supabase
      .from('place_photos')
      .insert({
        id,
        place_id: placeId,
        path,
        thumb_path: thumbPath,
        width: full.width,
        height: full.height,
        position,
      })
      .select(COLUMNS)
      .single();
    if (error || !data) {
      throw new Error(
        error?.code === 'P0001' && error.message ? error.message : 'Nem sikerült menteni a fotót.',
      );
    }
    return data as PlacePhoto;
  } catch (e) {
    // Ne maradjon árva fájl a tárolóban.
    await supabase.storage.from(BUCKET).remove([path, thumbPath]);
    throw e;
  }
}

/** Fotók törlése: előbb a sorok, utána a fájlok. */
export async function deletePhotos(photos: PlacePhoto[]): Promise<void> {
  if (photos.length === 0) return;
  const { error } = await supabase
    .from('place_photos')
    .delete()
    .in(
      'id',
      photos.map((p) => p.id),
    );
  if (error) throw new Error('Nem sikerült törölni a fotót.');
  await supabase.storage.from(BUCKET).remove(photos.flatMap((p) => [p.path, p.thumb_path]));
  photos.forEach((p) => {
    urlCache.delete(p.path);
    urlCache.delete(p.thumb_path);
  });
}

/** A saját helyek összes fotója. */
export async function fetchOwnPhotos(): Promise<PlacePhoto[] | null> {
  const { data, error } = await supabase.from('place_photos').select(COLUMNS);
  return error ? null : (data as PlacePhoto[]);
}

/** Más felhasználó fotói (ha a helyei láthatók), helyenként csoportosítva. */
export async function fetchProfilePhotos(userId: string): Promise<Record<string, PlacePhoto[]>> {
  const { data, error } = await supabase.rpc('get_profile_photos', { p_user: userId });
  const grouped = groupByPlace(error ? [] : ((data as PlacePhoto[] | null) ?? []));
  for (const [placeId, list] of Object.entries(grouped)) otherPhotoCache.set(placeId, list);
  return grouped;
}

/** Más felhasználók helyeinek fotói, hogy az adatlap újratöltés nélkül megnyíljon. */
const otherPhotoCache = new Map<string, PlacePhoto[]>();
export function getCachedPhotos(placeId: string): PlacePhoto[] {
  return otherPhotoCache.get(placeId) ?? [];
}

/** Minden helyhez az első fotó bélyegképének útvonala (a listákhoz). */
export function firstThumbPaths(byPlace: Record<string, PlacePhoto[]>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [placeId, list] of Object.entries(byPlace)) {
    if (list[0]) out[placeId] = list[0].thumb_path;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Aláírt linkek (a tároló privát), gyorsítótárral
// ---------------------------------------------------------------------------
const urlCache = new Map<string, { url: string; expires: number }>();

/** Aláírt linkek a megadott útvonalakhoz; a még érvényeseket a gyorsítótárból adja. */
export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  const now = Date.now();
  const out: Record<string, string> = {};
  const missing: string[] = [];
  for (const p of new Set(paths)) {
    const hit = urlCache.get(p);
    if (hit && hit.expires > now + 60_000) out[p] = hit.url;
    else missing.push(p);
  }
  if (missing.length > 0) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(missing, URL_TTL);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) {
        urlCache.set(item.path, { url: item.signedUrl, expires: now + URL_TTL * 1000 });
        out[item.path] = item.signedUrl;
      }
    }
  }
  return out;
}
