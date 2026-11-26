/** Helyek: típusok, állandók és tiszta (tesztelhető) segédfüggvények. */

export type PlaceStatus = 'visited' | 'wishlist';
export type PlaceType = 'etterem' | 'bar' | 'kocsma' | 'kavezo' | 'pekseg' | 'cukraszda';

/** Egy hely, ahogy az adatbázisban (`places` tábla) van. */
export type Place = {
  id: string;
  owner_id: string;
  status: PlaceStatus;
  type: PlaceType;
  name: string;
  address: string | null;
  district: string | null;
  cuisine: string | null;
  rating: number | null;
  price: number | null;
  would_return: boolean;
  notes: string | null;
  url: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  updated_at: string;
};

/** Az űrlapból mentett mezők (a többit az adatbázis tölti ki). */
export type PlaceInput = Pick<
  Place,
  | 'status'
  | 'type'
  | 'name'
  | 'address'
  | 'district'
  | 'cuisine'
  | 'rating'
  | 'price'
  | 'would_return'
  | 'notes'
  | 'url'
  | 'lat'
  | 'lng'
>;

/** Helytípusok; az ikonjuk az Icon komponensben, a típus kulcsával azonos néven. */
export const PLACE_TYPES: Record<PlaceType, { label: string }> = {
  etterem: { label: 'Étterem' },
  bar: { label: 'Bár' },
  kocsma: { label: 'Kocsma' },
  kavezo: { label: 'Kávézó' },
  pekseg: { label: 'Pékség' },
  cukraszda: { label: 'Cukrászda' },
};
export const PLACE_TYPE_KEYS = Object.keys(PLACE_TYPES) as PlaceType[];

export const DISTRICTS = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
  'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII',
] as const;

export const DEFAULT_CUISINES = [
  'magyar', 'olasz', 'pizza', 'burger', 'barbeque', 'japán', 'kínai', 'vietnámi', 'thai',
  'koreai', 'indiai', 'közel-keleti', 'mexikói', 'francia', 'görög', 'vegán', 'street food',
  'reggeliző', 'kovászos kenyér', 'péksütemény', 'croissant', 'specialty kávé', 'koktél', 'sör',
  'bor',
];

export const PRICE_LABELS: Record<number, string> = {
  1: 'Ft',
  2: 'Ft Ft',
  3: 'Ft Ft Ft',
  4: 'Ft Ft Ft Ft',
};

export const MAX_RATING = 10;

/** Budapest középpontja és egy, a várost lefedő térképkivágás. */
export const BUDAPEST_REGION = {
  latitude: 47.4979,
  longitude: 19.0402,
  latitudeDelta: 0.16,
  longitudeDelta: 0.16,
};

/**
 * Budapesti irányítószámból kerület: 1XXY → XX. kerület (pl. 1073 → VII).
 * Nem budapesti vagy érvénytelen számra null.
 */
export function districtFromPostcode(postcode: string | null | undefined): string | null {
  const m = /\b1(\d\d)\d\b/.exec(postcode ?? '');
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= DISTRICTS.length ? DISTRICTS[n - 1] : null;
}

/** Cím szövegéből kiszedi az első budapesti irányítószámot (ha van). */
export function postcodeFromText(text: string | null | undefined): string | null {
  const m = /\b(1\d{3})\b/.exec(text ?? '');
  return m ? m[1] : null;
}

/** Kerület kiolvasása szövegből, pl. „VII. ker.”, „VII. kerület” → VII. */
export function districtFromText(text: string | null | undefined): string | null {
  const m = /\b([IVX]{1,5})\.?\s*ker(?:ület)?\b/i.exec(text ?? '');
  if (!m) return null;
  const d = m[1].toUpperCase();
  return (DISTRICTS as readonly string[]).includes(d) ? d : null;
}

/** A felhasználó által a címben megadott kerület (irányítószámból vagy „VII. ker.” formából). */
export function districtHint(text: string | null | undefined): string | null {
  return districtFromPostcode(postcodeFromText(text)) ?? districtFromText(text);
}

/** Keresőszöveg a geokódolónak: Budapestre szűkítve. */
export function geocodeQuery(input: string): string {
  const q = input.trim();
  return /budapest/i.test(q) ? q : `${q}, Budapest`;
}

/**
 * Találatok sorrendje: ha a felhasználó megadta a kerületet (irányítószámmal vagy „VII. ker.”-rel),
 * az abban a kerületben lévő találatok kerülnek előre.
 */
export function rankByDistrict<T extends { district: string | null }>(results: T[], input: string): T[] {
  const hint = districtHint(input);
  if (!hint) return results;
  return [...results].sort((a, b) => Number(b.district === hint) - Number(a.district === hint));
}

/** A térképes pin színe: kívánságlista kék, a kipróbáltak az értékelés szerint. */
export function placeColor(place: Pick<Place, 'status' | 'rating'>): string {
  if (place.status === 'wishlist') return '#2F80ED';
  const r = place.rating;
  if (r == null) return '#8E8E93';
  if (r >= 9) return '#1E8E3E';
  if (r >= 7) return '#7CB342';
  if (r >= 5) return '#F2A900';
  return '#D93025';
}

export type PlaceFilters = {
  status: PlaceStatus | 'all';
  search: string;
  type: PlaceType | null;
  cuisine: string | null;
  onlyWouldReturn: boolean;
};

export const EMPTY_FILTERS: PlaceFilters = {
  status: 'visited',
  search: '',
  type: null,
  cuisine: null,
  onlyWouldReturn: false,
};

/** Ékezet- és kisbetű-független összehasonlításhoz. */
export function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Szűrés, majd rendezés: a legutóbb felvett hely kerül felülre. */
export function filterPlaces(places: Place[], f: PlaceFilters): Place[] {
  const q = fold(f.search.trim());
  const cuisine = f.cuisine ? fold(f.cuisine) : null;
  return places
    .filter((p) => f.status === 'all' || p.status === f.status)
    .filter((p) => !f.type || p.type === f.type)
    .filter((p) => !cuisine || fold(p.cuisine ?? '') === cuisine)
    .filter((p) => !f.onlyWouldReturn || (p.status === 'visited' && p.would_return))
    .filter(
      (p) =>
        !q ||
        [p.name, p.address, p.notes, p.cuisine].some((v) => v && fold(v).includes(q)),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Konyhatípusok a szűrőhöz és az űrlap javaslataihoz: a felhasználó sajátjai elöl. */
export function cuisineOptions(places: Pick<Place, 'cuisine'>[]): string[] {
  const used = places.map((p) => p.cuisine?.trim().toLowerCase()).filter((c): c is string => !!c);
  return [...new Set([...used, ...DEFAULT_CUISINES])];
}

/** Űrlap állapota (szöveges mezőkkel, ahogy a felhasználó gépeli). */
export type PlaceDraft = {
  status: PlaceStatus;
  type: PlaceType;
  name: string;
  address: string;
  district: string | null;
  cuisine: string;
  rating: number | null;
  price: number | null;
  wouldReturn: boolean;
  notes: string;
  url: string;
  lat: number | null;
  lng: number | null;
};

export function emptyDraft(status: PlaceStatus = 'visited'): PlaceDraft {
  return {
    status,
    type: 'etterem',
    name: '',
    address: '',
    district: null,
    cuisine: '',
    rating: null,
    price: null,
    wouldReturn: false,
    notes: '',
    url: '',
    lat: null,
    lng: null,
  };
}

export function draftFromPlace(p: Place): PlaceDraft {
  return {
    status: p.status,
    type: p.type,
    name: p.name,
    address: p.address ?? '',
    district: p.district,
    cuisine: p.cuisine ?? '',
    rating: p.rating,
    price: p.price,
    wouldReturn: p.would_return,
    notes: p.notes ?? '',
    url: p.url ?? '',
    lat: p.lat,
    lng: p.lng,
  };
}

/** Link kiegészítése https://-sel, ha a felhasználó nélküle írta be. */
export function normalizeUrl(url: string): string | null {
  const u = url.trim();
  if (!u) return null;
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

const blankToNull = (s: string) => (s.trim() ? s.trim() : null);

/** Ellenőrzés + átalakítás mentéshez. Hibánál { error }, különben { input }. */
export function draftToInput(d: PlaceDraft): { error: string } | { input: PlaceInput } {
  const name = d.name.trim();
  if (!name) return { error: 'Add meg a hely nevét.' };
  if (name.length > 200) return { error: 'A név legfeljebb 200 karakter lehet.' };
  if (d.rating != null && (d.rating < 1 || d.rating > MAX_RATING)) {
    return { error: 'Az értékelés 1 és 10 között lehet.' };
  }
  const visited = d.status === 'visited';
  return {
    input: {
      status: d.status,
      type: d.type,
      name,
      address: blankToNull(d.address),
      district: d.district,
      cuisine: d.cuisine.trim() ? d.cuisine.trim().toLowerCase() : null,
      // Kívánságlistás helynek még nincs értékelése.
      rating: visited ? d.rating : null,
      price: d.price,
      would_return: visited ? d.wouldReturn : false,
      notes: blankToNull(d.notes),
      url: normalizeUrl(d.url),
      lat: d.lat,
      lng: d.lng,
    },
  };
}
