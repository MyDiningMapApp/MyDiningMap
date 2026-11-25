import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import {
  groupFriendships,
  listFriendships,
  removeFriendship,
  respondFriendRequest,
  sendFriendRequest,
  type Friendship,
  type Relationship,
} from '@/lib/social';
import { useAuth } from '@/providers/auth-provider';

type FriendsState = {
  friends: Friendship[];
  incoming: Friendship[];
  outgoing: Friendship[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  /** Kapcsolat módosítása; utána frissíti a listát. Visszaadja az új kapcsolatot. */
  send: (userId: string) => Promise<Relationship>;
  respond: (userId: string, accept: boolean) => Promise<Relationship>;
  remove: (userId: string) => Promise<Relationship>;
};

const FriendsContext = createContext<FriendsState | null>(null);

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [data, setData] = useState<{ userId: string; list: Friendship[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((uid: string, result: Friendship[] | Error) => {
    if (result instanceof Error) {
      setError(result.message);
    } else {
      setError(null);
      setData({ userId: uid, list: result });
    }
  }, []);

  const load = useCallback(
    (uid: string) =>
      listFriendships().then(
        (list) => apply(uid, list),
        (e: Error) => apply(uid, e),
      ),
    [apply],
  );

  // Betöltés belépéskor, és frissítés, amikor az app újra előtérbe kerül
  // (amíg nincs push-értesítés, így jelennek meg az új jelölések).
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

  const wrap = useCallback(
    <A extends unknown[]>(fn: (...args: A) => Promise<Relationship>) =>
      async (...args: A) => {
        const rel = await fn(...args);
        await reload();
        return rel;
      },
    [reload],
  );

  const value = useMemo(() => {
    const list = data && data.userId === userId ? data.list : [];
    return {
      ...groupFriendships(list),
      loading: !!userId && data?.userId !== userId && !error,
      error,
      reload,
      send: wrap(sendFriendRequest),
      respond: wrap(respondFriendRequest),
      remove: wrap(removeFriendship),
    };
  }, [data, userId, error, reload, wrap]);

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends(): FriendsState {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends csak FriendsProvideren belül használható.');
  return ctx;
}
