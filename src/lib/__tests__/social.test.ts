import { describe, expect, it, jest } from '@jest/globals';

import { canViewPlaces, displayName, groupFriendships, type Friendship } from '../social';

// A Supabase-klienst nem töltjük be a tiszta függvények teszteléséhez (a jest ezt az importok elé emeli).
jest.mock('@/lib/supabase', () => ({ supabase: {} }));

const f = (username: string, relationship: Friendship['relationship']): Friendship => ({
  id: username,
  username,
  display_name: null,
  avatar_url: null,
  visibility: 'private',
  relationship,
  since: '2026-01-01T00:00:00Z',
});

describe('canViewPlaces', () => {
  it('saját, barát és publikus profil helyei láthatók', () => {
    expect(canViewPlaces({ relationship: 'self', visibility: 'private' })).toBe(true);
    expect(canViewPlaces({ relationship: 'friends', visibility: 'private' })).toBe(true);
    expect(canViewPlaces({ relationship: 'none', visibility: 'public' })).toBe(true);
  });

  it('privát, nem barát profil helyei rejtettek (függő jelölésnél is)', () => {
    for (const relationship of ['none', 'outgoing', 'incoming'] as const) {
      expect(canViewPlaces({ relationship, visibility: 'private' })).toBe(false);
    }
  });
});

describe('displayName', () => {
  it('a megjelenített nevet, vagy ha nincs, a @felhasználónevet adja', () => {
    expect(displayName({ username: 'anna', display_name: 'Kovács Anna' })).toBe('Kovács Anna');
    expect(displayName({ username: 'anna', display_name: '  ' })).toBe('@anna');
    expect(displayName({ username: 'anna', display_name: null })).toBe('@anna');
  });
});

describe('groupFriendships', () => {
  it('szétválogatja a bejövő, elküldött és elfogadott kapcsolatokat', () => {
    const g = groupFriendships([f('a', 'incoming'), f('b', 'friends'), f('c', 'outgoing'), f('d', 'friends')]);
    expect(g.incoming.map((x) => x.username)).toEqual(['a']);
    expect(g.outgoing.map((x) => x.username)).toEqual(['c']);
    expect(g.friends.map((x) => x.username)).toEqual(['b', 'd']);
  });
});
