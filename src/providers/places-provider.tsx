import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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
};

const PlacesContext = createContext<PlacesState | null>(null);

const COLUMNS =
  'id, owner_id, status, type, name, address, district, cuisine, rating, price, would_return, notes, url, lat, lng, created_at, updated_at';

/** Az összes saját hely, a legújabb elöl; hiba esetén null. */
async function fetchPlaces(): Promise<Place[] | null> {
  const { data, error } = await supabase
    .from('places')
    .select(COLUMNS)
    .order('created_at', { ascending: false });
  return error ? null : (data as Place[]);
}

const SAVE_ERROR = 'Nem sikerült menteni. Ellenőrizd az internetkapcsolatot, és próbáld újra.';

/** A bejelentkezett felhasználó saját helyei, betöltéssel és mentéssel. */
export function PlacesProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  // A listát a felhasználó azonosítójával együtt tároljuk, hogy fiókváltáskor ne keveredjen.
  const [data, setData] = useState<{ userId: string; places: Place[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyResult = useCallback((uid: string, result: Place[] | null) => {
    if (result) {
      setError(null);
      setData({ userId: uid, places: result });
    } else {
      setError('Nem sikerült betölteni a helyeket.');
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchPlaces().then((result) => {
      if (!cancelled) applyResult(userId, result);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, applyResult]);

  const places = useMemo(
    () => (data && data.userId === userId ? data.places : []),
    [data, userId],
  );
  const loading = !!userId && data?.userId !== userId && !error;

  const reload = useCallback(async () => {
    if (userId) applyResult(userId, await fetchPlaces());
  }, [userId, applyResult]);

  const getPlace = useCallback((id: string) => places.find((p) => p.id === id), [places]);

  const replaceLocal = useCallback(
    (fn: (list: Place[]) => Place[]) => {
      setData((prev) => (prev && prev.userId === userId ? { ...prev, places: fn(prev.places) } : prev));
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
      const { error: err } = await supabase.from('places').delete().eq('id', id);
      if (err) throw new Error('Nem sikerült törölni. Próbáld újra.');
      replaceLocal((list) => list.filter((p) => p.id !== id));
    },
    [replaceLocal],
  );

  const value = useMemo(
    () => ({ places, loading, error, reload, getPlace, createPlace, updatePlace, deletePlace }),
    [places, loading, error, reload, getPlace, createPlace, updatePlace, deletePlace],
  );

  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>;
}

export function usePlaces(): PlacesState {
  const ctx = useContext(PlacesContext);
  if (!ctx) throw new Error('usePlaces csak PlacesProvideren belül használható.');
  return ctx;
}
