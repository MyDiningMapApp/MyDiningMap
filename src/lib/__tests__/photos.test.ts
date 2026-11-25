import { describe, expect, it, jest } from '@jest/globals';

import {
  firstThumbPaths,
  fitSize,
  groupByPlace,
  MAX_PHOTOS,
  remainingSlots,
  type PlacePhoto,
} from '../photos';

// A natív modulokat és a Supabase-klienst nem töltjük be a tiszta függvények teszteléséhez.
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'uuid' }));
jest.mock('expo-image-manipulator', () => ({ ImageManipulator: {}, SaveFormat: { JPEG: 'jpeg' } }));

const photo = (id: string, place_id: string, position: number, created_at = '2026-01-01'): PlacePhoto => ({
  id,
  place_id,
  owner_id: 'u',
  path: `u/${place_id}/${id}.jpg`,
  thumb_path: `u/${place_id}/${id}_thumb.jpg`,
  width: 100,
  height: 100,
  position,
  created_at,
});

describe('fitSize', () => {
  it('a hosszabbik oldalt a megadott méretre kicsinyíti, arányosan', () => {
    expect(fitSize(4032, 3024, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitSize(3024, 4032, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it('kisebb képet nem nagyít', () => {
    expect(fitSize(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
});

describe('remainingSlots', () => {
  it(`legfeljebb ${MAX_PHOTOS} fotó lehet`, () => {
    expect(remainingSlots(0, 0)).toBe(6);
    expect(remainingSlots(2, 3)).toBe(1);
    expect(remainingSlots(4, 4)).toBe(0);
  });
});

describe('groupByPlace és firstThumbPaths', () => {
  const list = [photo('c', 'p1', 2), photo('a', 'p1', 1), photo('b', 'p2', 1), photo('d', 'p1', 1, '2026-02-01')];

  it('helyenként csoportosít, sorrend szerint (azonos sorszámnál a korábbi elöl)', () => {
    const g = groupByPlace(list);
    expect(g.p1.map((p) => p.id)).toEqual(['a', 'd', 'c']);
    expect(g.p2.map((p) => p.id)).toEqual(['b']);
  });

  it('minden helyhez az első fotó bélyegképét adja', () => {
    expect(firstThumbPaths(groupByPlace(list))).toEqual({
      p1: 'u/p1/a_thumb.jpg',
      p2: 'u/p2/b_thumb.jpg',
    });
  });
});
