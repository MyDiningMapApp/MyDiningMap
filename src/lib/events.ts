/** Események: típusok, adatbázis-függvények hívása és tiszta segédfüggvények. */
import { supabase } from '@/lib/supabase';

export type EventResponse = 'pending' | 'going' | 'maybe' | 'declined';
export type EventStatus = 'active' | 'cancelled';

/** Egy sor az Események listában (list_my_events). */
export type EventSummary = {
  id: string;
  title: string;
  starts_at: string;
  status: EventStatus;
  is_organizer: boolean;
  organizer_username: string;
  organizer_display_name: string | null;
  /** A saját válaszom; szervezőként null. */
  my_response: EventResponse | null;
  chosen_place: string | null;
  option_count: number;
  going_count: number;
  invitee_count: number;
  has_suggestions: boolean;
};

export type EventPerson = {
  id: string;
  username: string;
  display_name: string | null;
};

export type EventInvitee = EventPerson & {
  response: EventResponse;
  suggested_time: string | null;
  comment: string | null;
  responded_at: string | null;
};

export type EventOption = {
  id: string;
  name: string;
  address: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  source_place_id: string | null;
  votes: number;
  my_vote: boolean;
  voters: string[];
};

export type EventDetails = {
  id: string;
  title: string;
  starts_at: string;
  note: string | null;
  status: EventStatus;
  chosen_option_id: string | null;
  is_organizer: boolean;
  organizer: EventPerson;
  invitees: EventInvitee[];
  options: EventOption[];
};

/** Egy javasolt hely az esemény létrehozásakor / hozzáadásakor. */
export type OptionInput = {
  name: string;
  address?: string | null;
  district?: string | null;
  lat?: number | null;
  lng?: number | null;
  source_place_id?: string | null;
};

export const RESPONSE_LABELS: Record<EventResponse, string> = {
  pending: 'Még nem válaszolt',
  going: 'Jön',
  maybe: 'Talán',
  declined: 'Nem jön',
};

export const RESPONSE_ICONS: Record<EventResponse, string> = {
  pending: '⏳',
  going: '✅',
  maybe: '🤔',
  declined: '❌',
};

// ---------------------------------------------------------------------------
// Adatbázis-függvények
// ---------------------------------------------------------------------------
const NETWORK_ERROR = 'Nem sikerült elérni a szervert. Ellenőrizd az internetkapcsolatot.';

/** Az adatbázis magyar hibaüzenetei (P0001) továbbmennek, a többi általános üzenet lesz. */
function fail(error: { code?: string; message?: string } | null): never {
  throw new Error(error?.code === 'P0001' && error.message ? error.message : NETWORK_ERROR);
}

async function call<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) fail(error);
  return data as T;
}

export const listMyEvents = () => call<EventSummary[]>('list_my_events').then((d) => d ?? []);

export const getEvent = (id: string) => call<EventDetails | null>('get_event', { p_event: id });

export const createEvent = (args: {
  title: string;
  startsAt: Date;
  note: string;
  invitees: string[];
  options: OptionInput[];
}) =>
  call<string>('create_event', {
    p_title: args.title,
    p_starts_at: args.startsAt.toISOString(),
    p_note: args.note,
    p_invitees: args.invitees,
    p_options: args.options,
  });

export const updateEvent = (id: string, title: string, startsAt: Date, note: string) =>
  call<void>('update_event', {
    p_event: id,
    p_title: title,
    p_starts_at: startsAt.toISOString(),
    p_note: note,
  });

export const addEventInvitees = (id: string, users: string[]) =>
  call<void>('add_event_invitees', { p_event: id, p_users: users });

export const addEventOption = (id: string, option: OptionInput) =>
  call<string>('add_event_option', { p_event: id, p_option: option });

export const removeEventOption = (optionId: string) =>
  call<void>('remove_event_option', { p_option: optionId });

export const chooseEventOption = (id: string, optionId: string | null) =>
  call<void>('choose_event_option', { p_event: id, p_option: optionId });

export const respondEvent = (
  id: string,
  response: EventResponse,
  suggestedTime: Date | null,
  comment: string | null,
) =>
  call<void>('respond_event', {
    p_event: id,
    p_response: response,
    p_suggested_time: suggestedTime ? suggestedTime.toISOString() : null,
    p_comment: comment,
  });

export const setEventVote = (optionId: string, vote: boolean) =>
  call<void>('set_event_vote', { p_option: optionId, p_vote: vote });

export const cancelEvent = (id: string) => call<void>('cancel_event', { p_event: id });

// ---------------------------------------------------------------------------
// Tiszta segédfüggvények
// ---------------------------------------------------------------------------

/** Egy esemény „korábbi”, ha a kezdése óta több mint 6 óra telt el. */
const PAST_AFTER_MS = 6 * 60 * 60 * 1000;

export function splitEvents(list: EventSummary[], now: Date = new Date()) {
  const cutoff = now.getTime() - PAST_AFTER_MS;
  const upcoming = list
    .filter((e) => new Date(e.starts_at).getTime() >= cutoff)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = list
    .filter((e) => new Date(e.starts_at).getTime() < cutoff)
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  return { upcoming, past };
}

/** Hány közelgő, aktív meghívóra nem válaszoltam még (a fül számlálójához). */
export function pendingInviteCount(list: EventSummary[], now: Date = new Date()): number {
  return splitEvents(list, now).upcoming.filter(
    (e) => e.status === 'active' && !e.is_organizer && e.my_response === 'pending',
  ).length;
}

const WEEKDAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
const MONTHS = [
  'január',
  'február',
  'március',
  'április',
  'május',
  'június',
  'július',
  'augusztus',
  'szeptember',
  'október',
  'november',
  'december',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Magyar dátum és idő, pl. „november 28., péntek 19:00” (más évben az évvel együtt). */
export function formatEventTime(iso: string | Date, now: Date = new Date()): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const year = d.getFullYear() !== now.getFullYear() ? `${d.getFullYear()}. ` : '';
  return `${year}${MONTHS[d.getMonth()]} ${d.getDate()}., ${WEEKDAYS[d.getDay()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Alapértelmezett időpont új eseményhez: holnap 19:00. */
export function defaultEventTime(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(19, 0, 0, 0);
  return d;
}

/** A javasolt helyek sorrendje: a legtöbb szavazatot kapott elöl. */
export function sortOptions(options: EventOption[]): EventOption[] {
  return [...options].sort((a, b) => b.votes - a.votes);
}

/** Rövid állapotszöveg a listához. */
export function eventPlaceSummary(e: Pick<EventSummary, 'chosen_place' | 'option_count'>): string {
  if (e.chosen_place) return `📍 ${e.chosen_place}`;
  return `🗳️ Szavazás: ${e.option_count} hely`;
}
