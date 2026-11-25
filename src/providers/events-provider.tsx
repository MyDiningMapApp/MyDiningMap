import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { listMyEvents, pendingInviteCount, type EventSummary } from '@/lib/events';
import { useAuth } from '@/providers/auth-provider';

type EventsState = {
  events: EventSummary[];
  loading: boolean;
  error: string | null;
  /** Válaszra váró meghívók száma (fül-számláló). */
  pendingCount: number;
  reload: () => Promise<void>;
};

const EventsContext = createContext<EventsState | null>(null);

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [data, setData] = useState<{ userId: string; list: EventSummary[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (uid: string) =>
      listMyEvents().then(
        (list) => {
          setError(null);
          setData({ userId: uid, list });
        },
        (e: Error) => setError(e.message),
      ),
    [],
  );

  // Betöltés belépéskor, és frissítés, amikor az app előtérbe kerül
  // (amíg nincs push-értesítés, így jelennek meg az új meghívók).
  useEffect(() => {
    if (!userId) return;
    load(userId);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load(userId);
    });
    return () => sub.remove();
  }, [userId, load]);

  const reload = useCallback(async () => {
    if (userId) await load(userId);
  }, [userId, load]);

  const value = useMemo(() => {
    const events = data && data.userId === userId ? data.list : [];
    return {
      events,
      loading: !!userId && data?.userId !== userId && !error,
      error,
      pendingCount: pendingInviteCount(events),
      reload,
    };
  }, [data, userId, error, reload]);

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents(): EventsState {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents csak EventsProvideren belül használható.');
  return ctx;
}
