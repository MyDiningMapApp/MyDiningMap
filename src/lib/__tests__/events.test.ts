import { describe, expect, it, jest } from '@jest/globals';

import {
  defaultEventTime,
  eventPlaceSummary,
  formatEventTime,
  pendingInviteCount,
  sortOptions,
  splitEvents,
  type EventOption,
  type EventSummary,
} from '../events';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));

const NOW = new Date(2026, 10, 25, 12, 0); // 2026. november 25., szerda 12:00

const ev = (over: Partial<EventSummary>): EventSummary => ({
  id: Math.random().toString(36).slice(2),
  title: 'Esemény',
  starts_at: new Date(2026, 10, 28, 19, 0).toISOString(),
  status: 'active',
  is_organizer: false,
  organizer_username: 'anna',
  organizer_display_name: null,
  my_response: 'pending',
  chosen_place: null,
  option_count: 2,
  going_count: 0,
  invitee_count: 1,
  has_suggestions: false,
  ...over,
});

describe('formatEventTime', () => {
  it('magyar dátumot ad a hét napjával', () => {
    expect(formatEventTime(new Date(2026, 10, 28, 19, 0), NOW)).toBe('november 28., szombat 19:00');
    expect(formatEventTime(new Date(2026, 11, 1, 8, 5), NOW)).toBe('december 1., kedd 08:05');
  });

  it('más évben az évet is kiírja', () => {
    expect(formatEventTime(new Date(2027, 0, 2, 18, 30), NOW)).toBe('2027. január 2., szombat 18:30');
  });
});

describe('defaultEventTime', () => {
  it('holnap 19:00', () => {
    const d = defaultEventTime(NOW);
    expect([d.getDate(), d.getHours(), d.getMinutes()]).toEqual([26, 19, 0]);
  });
});

describe('splitEvents és pendingInviteCount', () => {
  const soon = ev({ title: 'Hamarosan', starts_at: new Date(2026, 10, 26, 19).toISOString() });
  const later = ev({ title: 'Később', starts_at: new Date(2026, 11, 5, 19).toISOString() });
  const justStarted = ev({ title: 'Most kezdődött', starts_at: new Date(2026, 10, 25, 9).toISOString() });
  const past = ev({ title: 'Régi', starts_at: new Date(2026, 10, 20, 19).toISOString() });
  const mine = ev({ title: 'Saját', is_organizer: true, my_response: null });
  const answered = ev({ title: 'Válaszolt', my_response: 'going' });
  const cancelled = ev({ title: 'Lemondott', status: 'cancelled' });

  it('közelgő (időrendben) és korábbi (fordított időrendben); 6 órán belül még közelgő', () => {
    const { upcoming, past: old } = splitEvents([later, past, soon, justStarted], NOW);
    expect(upcoming.map((e) => e.title)).toEqual(['Most kezdődött', 'Hamarosan', 'Később']);
    expect(old.map((e) => e.title)).toEqual(['Régi']);
  });

  it('csak a közelgő, aktív, megválaszolatlan meghívókat számolja', () => {
    expect(pendingInviteCount([soon, later, past, mine, answered, cancelled], NOW)).toBe(2);
  });
});

describe('sortOptions és eventPlaceSummary', () => {
  const opt = (name: string, votes: number): EventOption => ({
    id: name,
    name,
    address: null,
    district: null,
    lat: null,
    lng: null,
    source_place_id: null,
    votes,
    my_vote: false,
    voters: [],
  });

  it('a legtöbb szavazatot kapott hely kerül előre', () => {
    expect(sortOptions([opt('A', 1), opt('B', 3), opt('C', 0)]).map((o) => o.name)).toEqual([
      'B',
      'A',
      'C',
    ]);
  });

  it('kiválasztott hely vagy szavazás', () => {
    expect(eventPlaceSummary({ chosen_place: 'Mori Ramen', option_count: 3 })).toBe('📍 Mori Ramen');
    expect(eventPlaceSummary({ chosen_place: null, option_count: 3 })).toBe('🗳️ Szavazás: 3 hely');
  });
});
