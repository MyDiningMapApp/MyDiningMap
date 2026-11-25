import { useEffect, useState } from 'react';

import { signedUrls } from '@/lib/photos';

/** Aláírt linkek a megadott tárolóbeli útvonalakhoz (amíg nincsenek meg, üres objektum). */
export function useSignedUrls(paths: string[]): Record<string, string> {
  const key = paths.join('|');
  const [state, setState] = useState<{ key: string; urls: Record<string, string> }>({
    key: '',
    urls: {},
  });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    signedUrls(key.split('|')).then((urls) => {
      if (!cancelled) setState({ key, urls });
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return state.key === key ? state.urls : {};
}
