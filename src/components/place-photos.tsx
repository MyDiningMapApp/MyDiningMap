import { useMemo, useState } from 'react';

import { PhotoStrip } from '@/components/photo-strip';
import { PhotoViewer } from '@/components/photo-viewer';
import { useSignedUrls } from '@/hooks/use-signed-urls';
import type { PlacePhoto } from '@/lib/photos';

/** Egy hely fotói az adatlapon: bélyegkép-sor, koppintásra teljes képernyős nézet. */
export function PlacePhotos({ photos }: { photos: PlacePhoto[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const thumbs = useSignedUrls(photos.map((p) => p.thumb_path));
  // A nagy képeket csak akkor kérjük le, ha a nézegető meg van nyitva.
  const fulls = useSignedUrls(open === null ? [] : photos.map((p) => p.path));

  const items = useMemo(
    () => photos.map((p) => ({ key: p.id, uri: thumbs[p.thumb_path] })),
    [photos, thumbs],
  );

  if (photos.length === 0) return null;
  return (
    <>
      <PhotoStrip items={items} size={110} onPressItem={setOpen} />
      <PhotoViewer
        uris={photos.map((p) => fulls[p.path])}
        index={open}
        onClose={() => setOpen(null)}
      />
    </>
  );
}
