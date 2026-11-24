import { describe, expect, it } from '@jest/globals';

import {
  cuisineOptions,
  districtHint,
  geocodeQuery,
  rankByDistrict,
  districtFromPostcode,
  draftToInput,
  emptyDraft,
  EMPTY_FILTERS,
  filterPlaces,
  normalizeUrl,
  placeColor,
  postcodeFromText,
  type Place,
} from '../places';

function place(over: Partial<Place>): Place {
  return {
    id: Math.random().toString(36).slice(2),
    owner_id: 'u1',
    status: 'visited',
    type: 'etterem',
    name: 'Hely',
    address: null,
    district: null,
    cuisine: null,
    rating: null,
    price: null,
    would_return: false,
    notes: null,
    url: null,
    lat: null,
    lng: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...over,
  };
}

describe('districtFromPostcode', () => {
  it('budapesti irányítószámból kerületet ad', () => {
    expect(districtFromPostcode('1073')).toBe('VII');
    expect(districtFromPostcode('1011')).toBe('I');
    expect(districtFromPostcode('1117')).toBe('XI');
    expect(districtFromPostcode('1239')).toBe('XXIII');
  });

  it('nem budapesti vagy hibás számra null', () => {
    expect(districtFromPostcode('2040')).toBeNull();
    expect(districtFromPostcode('1000')).toBeNull();
    expect(districtFromPostcode('1240')).toBeNull();
    expect(districtFromPostcode('')).toBeNull();
    expect(districtFromPostcode(null)).toBeNull();
  });
});

describe('postcodeFromText', () => {
  it('kiszedi az irányítószámot a címből', () => {
    expect(postcodeFromText('Akácfa utca 55 1073')).toBe('1073');
    expect(postcodeFromText('1092 Budapest, Ráday u. 7')).toBe('1092');
    expect(postcodeFromText('Király utca 12')).toBeNull();
  });
});

describe('placeColor', () => {
  it('kívánságlista kék, a többi az értékelés szerint', () => {
    expect(placeColor({ status: 'wishlist', rating: 10 })).toBe('#2F80ED');
    expect(placeColor({ status: 'visited', rating: 10 })).toBe('#1E8E3E');
    expect(placeColor({ status: 'visited', rating: 7 })).toBe('#7CB342');
    expect(placeColor({ status: 'visited', rating: 5 })).toBe('#F2A900');
    expect(placeColor({ status: 'visited', rating: 2 })).toBe('#D93025');
    expect(placeColor({ status: 'visited', rating: null })).toBe('#8E8E93');
  });
});

describe('filterPlaces', () => {
  const list = [
    place({ name: 'Mori Ramen', cuisine: 'japán', rating: 10, would_return: true, created_at: '2026-01-03T00:00:00Z' }),
    place({ name: 'Kávé Műhely', type: 'kavezo', notes: 'Jó croissant', created_at: '2026-01-02T00:00:00Z' }),
    place({ name: 'Szimpla', type: 'kocsma', status: 'wishlist', created_at: '2026-01-04T00:00:00Z' }),
  ];

  it('státusz szerint szűr, a legújabb elöl', () => {
    expect(filterPlaces(list, EMPTY_FILTERS).map((p) => p.name)).toEqual(['Mori Ramen', 'Kávé Műhely']);
    expect(filterPlaces(list, { ...EMPTY_FILTERS, status: 'all' }).map((p) => p.name)).toEqual([
      'Szimpla',
      'Mori Ramen',
      'Kávé Műhely',
    ]);
  });

  it('ékezet- és kisbetű-független keresés névben és jegyzetben', () => {
    expect(filterPlaces(list, { ...EMPTY_FILTERS, search: 'kave' }).map((p) => p.name)).toEqual(['Kávé Műhely']);
    expect(filterPlaces(list, { ...EMPTY_FILTERS, search: 'CROISSANT' })).toHaveLength(1);
  });

  it('típus, konyha és „visszamennék” szűrő', () => {
    expect(filterPlaces(list, { ...EMPTY_FILTERS, type: 'kavezo' })).toHaveLength(1);
    expect(filterPlaces(list, { ...EMPTY_FILTERS, cuisine: 'Japán' })).toHaveLength(1);
    expect(filterPlaces(list, { ...EMPTY_FILTERS, onlyWouldReturn: true }).map((p) => p.name)).toEqual([
      'Mori Ramen',
    ]);
  });
});

describe('cuisineOptions', () => {
  it('a saját konyhák elöl, ismétlés nélkül', () => {
    const opts = cuisineOptions([{ cuisine: 'Ramen' }, { cuisine: 'japán' }, { cuisine: null }]);
    expect(opts[0]).toBe('ramen');
    expect(opts.filter((c) => c === 'japán')).toHaveLength(1);
  });
});

describe('normalizeUrl', () => {
  it('https:// előtagot tesz, ha hiányzik', () => {
    expect(normalizeUrl('maps.app.goo.gl/abc')).toBe('https://maps.app.goo.gl/abc');
    expect(normalizeUrl('http://pelda.hu')).toBe('http://pelda.hu');
    expect(normalizeUrl('  ')).toBeNull();
  });
});

describe('draftToInput', () => {
  it('név nélkül hibát ad', () => {
    expect(draftToInput({ ...emptyDraft(), name: '  ' })).toEqual({ error: 'Add meg a hely nevét.' });
  });

  it('kívánságlistás helynél törli az értékelést és a „visszamennék”-et', () => {
    const r = draftToInput({ ...emptyDraft('wishlist'), name: 'X', rating: 8, wouldReturn: true });
    expect('input' in r && r.input.rating).toBeNull();
    expect('input' in r && r.input.would_return).toBe(false);
  });

  it('üres mezőket null-ra, a konyhát kisbetűsre alakítja', () => {
    const r = draftToInput({ ...emptyDraft(), name: ' Mori ', cuisine: ' Japán ', notes: ' ', rating: 9 });
    expect(r).toMatchObject({ input: { name: 'Mori', cuisine: 'japán', notes: null, rating: 9, address: null } });
  });
});

describe('districtHint és rankByDistrict', () => {
  it('irányítószámból vagy „VII. ker.” formából kiolvassa a kerületet', () => {
    expect(districtHint('Akácfa utca 55, 1073')).toBe('VII');
    expect(districtHint('Akácfa utca 55, VII. ker.')).toBe('VII');
    expect(districtHint('Bartók Béla út 1, xi kerület')).toBe('XI');
    expect(districtHint('Akácfa utca 55')).toBeNull();
  });

  it('a megadott kerületben lévő találatot előre veszi', () => {
    const results = [{ district: 'XX' }, { district: 'VII' }];
    expect(rankByDistrict(results, 'Akácfa utca 55, 1073')[0].district).toBe('VII');
    expect(rankByDistrict(results, 'Akácfa utca 55')[0].district).toBe('XX');
  });

  it('a keresőszöveget Budapestre szűkíti', () => {
    expect(geocodeQuery(' Akácfa utca 55 ')).toBe('Akácfa utca 55, Budapest');
    expect(geocodeQuery('1073 Budapest, Akácfa utca 55')).toBe('1073 Budapest, Akácfa utca 55');
  });
});
