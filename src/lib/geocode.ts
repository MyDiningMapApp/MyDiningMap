/**
 * Címkeresés iOS-en/Androidon: a telefon beépített geokódolója (expo-location).
 * iOS-en ehhez nem kell helyhozzáférési engedély.
 */
import * as Location from 'expo-location';

import { districtFromPostcode, geocodeQuery, rankByDistrict } from '@/lib/places';

export type GeocodeResult = {
  lat: number;
  lng: number;
  /** Megjeleníthető cím, pl. „Akácfa utca 55, 1073 Budapest”. */
  label: string;
  /** Rövid cím a „Cím” mezőbe, pl. „Akácfa utca 55”. */
  address: string | null;
  district: string | null;
};

function describe(a: Location.LocationGeocodedAddress | undefined) {
  const street = [a?.street, a?.streetNumber].filter(Boolean).join(' ') || a?.name || null;
  const city = [a?.postalCode, a?.city].filter(Boolean).join(' ');
  const district = districtFromPostcode(a?.postalCode);
  const label = [street, city].filter(Boolean).join(', ') || 'Ismeretlen cím';
  return {
    address: street,
    label: district ? `${label} (${district}. ker.)` : label,
    district,
  };
}

/** Koordinátából cím (térképen kijelöléskor). */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  try {
    const [a] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    return { lat, lng, ...describe(a) };
  } catch {
    return { lat, lng, label: 'Kijelölt pont', address: null, district: null };
  }
}

/** Cím szövegéből találatok (legfeljebb 5), Budapestre szűkítve. */
export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  const hits = (await Location.geocodeAsync(geocodeQuery(query))).slice(0, 5);
  const results = await Promise.all(hits.map((h) => reverseGeocode(h.latitude, h.longitude)));
  return rankByDistrict(results, query);
}
