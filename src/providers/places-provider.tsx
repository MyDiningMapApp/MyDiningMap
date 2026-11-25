import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  deletePhotos,
  fetchOwnPhotos,
  groupByPlace,
  uploadPhoto,
  type LocalPhoto,
  type PlacePhoto,
} from '@/lib/photos';
import type { Place, PlaceInput } from '@/lib/places';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

type PlacesState = {
  places: Place[];
  /** Az első betöltés folyamatban. */
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  getPlace: (id: string) => Place | undefined;
  createPlace: (input: PlaceInput) => Promise<Place>;
  updatePlace: (id: string, input: Partial<PlaceInput>) => Promise<Place>;
  deletePlace: (id: string) => Promise<void>;
  /** A saját helyek fotói helyenként, sorrendben. */
  photosByPlace: Record<string, PlacePhoto[]>;
  /** Új fotók feltöltése egy helyhez (egyenként, előrehaladás-jelzéssel). */
  addPhotos: (
    placeId: string,
    photos: LocalPhoto[],
    onProgress?: (done: number, total: number) => void,
  ) => Promise<void>;
  removePhotos: (photos: PlacePhoto[]) => Promise<void>;
};

type Loaded = { userId: string; places: Place[]; photos: PlacePhoto[] };

const PlacesContext = createContext<PlacesState | null>(null);

const COLUMNS =
  'id, owner_id, status, type, name, address, district, cuisine, rating, price, would_return, notes, url, lat, lng, created_at, updated_at';

/** Az összes saját hely (a legújabb elöl) és a fotóik; hiba esetén null. */
async function fetchAll(): Promise<Omit<Loaded, 'userId'> | null> {
  const [placesRes, photos] = await Promise.all([
    supabase.from('places').select(COLUMNS).order('created_at', { ascending: false }),
    fetchOwnPhotos(),
  ]);
  if (placesRes.error) return null;
  // Ha a fotók nem tölthetők be, a helyek attól még megjelennek.
  return { places: placesRes.data as Place[], photos: photos ?? [] };
}

const SAVE_ERROR = 'Nem sikerült menteni. Ellenőrizd az internetkapcsolatot, és próbáld újra.';

/** A bejelentkezett felhasználó saját helyei, betöltéssel és mentéssel. */
export function PlacesProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  // A listát a felhasználó azonosítójával együtt tároljuk, hogy fiókváltáskor ne keveredjen.
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyResult = useCallback((uid: string, result: Omit<Loaded, 'userId'> | null) => {
    if (result) {
      setError(null);
      setData({ userId: uid, ...result });
    } else {
      setError('Nem sikerült betölteni a helyeket.');
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchAll().then((result) => {
      if (!cancelled) applyResult(userId, result);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, applyResult]);

  const current = data && data.userId === userId ? data : null;
  const places = useMemo(() => current?.places ?? [], [current]);
  const photosByPlace = useMemo(() => groupByPlace(current?.photos ?? []), [current]);
  const loading = !!userId && data?.userId !== userId && !error;

  const reload = useCallback(async () => {
    if (userId) applyResult(userId, await fetchAll());
  }, [userId, applyResult]);

  const getPlace = useCallback((id: string) => places.find((p) => p.id === id), [places]);

  const replaceLocal = useCallback(
    (fn: (list: Place[]) => Place[]) => {
      setData((prev) => (prev && prev.userId === userId ? { ...prev, places: fn(prev.places) } : prev));
    },
    [userId],
  );

  const replacePhotos = useCallback(
    (fn: (list: PlacePhoto[]) => PlacePhoto[]) => {
      setData((prev) => (prev && prev.userId === userId ? { ...prev, photos: fn(prev.photos) } : prev));
    },
    [userId],
  );

  const createPlace = useCallback(
    async (input: PlaceInput) => {
      const { data: row, error: err } = await supabase
        .from('places')
        .insert(input)
        .select(COLUMNS)
        .single();
      if (err || !row) throw new Error(SAVE_ERROR);
      replaceLocal((list) => [row as Place, ...list]);
      return row as Place;
    },
    [replaceLocal],
  );

  const updatePlace = useCallback(
    async (id: string, input: Partial<PlaceInput>) => {
      const { data: row, error: err } = await supabase
        .from('places')
        .update(input)
        .eq('id', id)
        .select(COLUMNS)
        .single();
      if (err || !row) throw new Error(SAVE_ERROR);
      replaceLocal((list) => list.map((p) => (p.id === id ? (row as Place) : p)));
      return row as Place;
    },
    [replaceLocal],
  );

  const deletePlace = useCallback(
    async (id: string) => {
      // Előbb a fotókat töröljük (a fájlokat a tárolóból is), utána a helyet.
      await deletePhotos(photosByPlace[id] ?? []);
      const { error: err } = await supabase.from('places').delete().eq('id', id);
      if (err) throw new Error('Nem sikerült törölni. Próbáld újra.');
      replaceLocal((list) => list.filter((p) => p.id !== id));
      replacePhotos((list) => list.filter((p) => p.place_id !== id));
    },
    [photosByPlace, replaceLocal, replacePhotos],
  );

  const addPhotos = useCallback(
    async (
      placeId: string,
      photos: LocalPhoto[],
      onProgress?: (done: number, total: number) => void,
    ) => {
      if (!userId || photos.length === 0) return;
      const existing = photosByPlace[placeId] ?? [];
      let position = existing.reduce((max, p) => Math.max(max, p.position), 0);
      for (let i = 0; i < photos.length; i++) {
        onProgress?.(i, photos.length);
        position += 1;
        const saved = await uploadPhoto(userId, placeId, photos[i], position);
        replacePhotos((list) => [...list, saved]);
      }
      onProgress?.(photos.length, photos.length);
    },
    [userId, photosByPlace, replacePhotos],
  );

  const removePhotos = useCallback(
    async (photos: PlacePhoto[]) => {
      await deletePhotos(photos);
      const ids = new Set(photos.map((p) => p.id));
      replacePhotos((list) => list.filter((p) => !ids.has(p.id)));
    },
    [replacePhotos],
  );

  const value = useMemo(
    () => ({
      places,
      loading,
      error,
      reload,
      getPlace,
      createPlace,
      updatePlace,
      deletePlace,
      photosByPlace,
      addPhotos,
      removePhotos,
    }),
    [
      places,
      loading,
      error,
      reload,
      getPlace,
      createPlace,
      updatePlace,
      deletePlace,
      photosByPlace,
      addPhotos,
      removePhotos,
    ],
  );

  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>;
}

export function usePlaces(): PlacesState {
  const ctx = useContext(PlacesContext);
  if (!ctx) throw new Error('usePlaces csak PlacesProvideren belül használható.');
  return ctx;
}
