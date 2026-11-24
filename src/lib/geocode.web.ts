/**
 * Címkeresés a webes változatban (csak fejlesztés közbeni ellenőrzésre):
 * OpenStreetMap Nominatim. Az iOS-app a telefon beépített geokódolóját használja (geocode.ts).
 */
import { districtFromPostcode, geocodeQuery, rankByDistrict } from '@/lib/places';

export type GeocodeResult = {
  lat: number;
  lng: number;
  label: string;
  address: string | null;
  district: string | null;
};

type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
  address?: { road?: string; house_number?: string; postcode?: string; city?: string };
};

function toResult(h: NominatimHit): GeocodeResult {
  const a = h.address ?? {};
  const street = [a.road, a.house_number].filter(Boolean).join(' ') || null;
  const city = [a.postcode, a.city].filter(Boolean).join(' ');
  const district = districtFromPostcode(a.postcode);
  const label = [street, city].filter(Boolean).join(', ') || h.display_name;
  return {
    lat: Number(h.lat),
    lng: Number(h.lon),
    label: district ? `${label} (${district}. ker.)` : label,
    address: street,
    district,
  };
}

const BASE = 'https://nominatim.openstreetmap.org';

export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({
    q: geocodeQuery(query),
    format: 'jsonv2',
    addressdetails: '1',
    limit: '5',
    countrycodes: 'hu',
  });
  const res = await fetch(`${BASE}/search?${params}`, { headers: { 'Accept-Language': 'hu' } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return rankByDistrict(((await res.json()) as NominatimHit[]).map(toResult), query);
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'jsonv2',
      addressdetails: '1',
    });
    const res = await fetch(`${BASE}/reverse?${params}`, { headers: { 'Accept-Language': 'hu' } });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    return { ...toResult((await res.json()) as NominatimHit), lat, lng };
  } catch {
    return { lat, lng, label: 'Kijelölt pont', address: null, district: null };
  }
}
