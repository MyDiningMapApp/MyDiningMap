#!/usr/bin/env node
/**
 * A régi webes MyDiningMap `data.json`-ját SQL-lé alakítja, amit a Supabase SQL Editorában
 * lefuttatva a helyek a megadott felhasználó fiókjába kerülnek.
 *
 * Használat:
 *   node scripts/import-old-places.mjs <data.json> <felhasználónév> > import.sql
 *
 * - A régi 0-s értékelés (kívánságlista) üres lesz; az üres szövegek NULL-ok.
 * - Az eredeti felvételi dátum megmarad.
 * - Dupla futtatás ellen védett: a felhasználónál már meglévő, azonos nevű helyeket kihagyja.
 */
import { readFileSync } from 'node:fs';

const [, , file, username] = process.argv;
if (!file || !username) {
  console.error('Használat: node scripts/import-old-places.mjs <data.json> <felhasználónév>');
  process.exit(1);
}
if (!/^[a-z0-9._]{3,30}$/.test(username)) {
  console.error(`Érvénytelen felhasználónév: ${username}`);
  process.exit(1);
}

const TYPES = new Set(['etterem', 'bar', 'kocsma', 'kavezo', 'pekseg', 'cukraszda']);
const DISTRICTS = new Set([
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
  'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII',
]);

const str = (v) => (v == null || String(v).trim() === '' ? 'null' : `'${String(v).trim().replace(/'/g, "''")}'`);
const num = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? 'null' : String(Number(v)));

function convert(old) {
  const status = old.status === 'wishlist' ? 'wishlist' : 'visited';
  // A nagyon régi bejegyzések 1–5-ös skálán voltak (scale nélkül).
  let rating = Number(old.rating) || 0;
  if (old.scale !== 10 && rating) rating = Math.min(10, rating * 2);
  const price = Number(old.price);
  const created = old.createdAt || new Date().toISOString();
  return [
    str(status),
    str(TYPES.has(old.type) ? old.type : 'etterem'),
    str(old.name),
    str(old.address),
    str(DISTRICTS.has(old.district) ? old.district : null),
    str(old.cuisine ? String(old.cuisine).toLowerCase() : null),
    status === 'visited' && rating >= 1 && rating <= 10 ? String(rating) : 'null',
    price >= 1 && price <= 4 ? String(price) : 'null',
    status === 'visited' && old.wouldReturn ? 'true' : 'false',
    str(old.notes),
    str(old.url),
    num(old.lat),
    num(old.lng),
    str(created),
    str(old.updatedAt || created),
  ];
}

const data = JSON.parse(readFileSync(file, 'utf8'));
if (!Array.isArray(data)) {
  console.error('A fájl nem a várt formátumú (tömböt vártam).');
  process.exit(1);
}
const rows = data.filter((p) => p && String(p.name ?? '').trim()).map(convert);

const out = [];
out.push(`-- A régi MyDiningMap ${rows.length} helyének áttöltése a @${username} fiókba.`);
out.push('-- Futtatás: Supabase → SQL Editor → New query → bemásolás → Run.');
out.push('begin;');
out.push('');
out.push(`do $$
begin
  if not exists (select 1 from public.profiles where username = '${username}') then
    raise exception 'Nincs ilyen felhasználónév: ${username}';
  end if;
end $$;`);
out.push('');
out.push(`with u as (
  select id from public.profiles where username = '${username}'
),
v (status, type, name, address, district, cuisine, rating, price, would_return, notes, url, lat, lng, created_at, updated_at) as (
  values`);
out.push(rows.map((r) => `    (${r.join(', ')})`).join(',\n'));
out.push(`)
insert into public.places
  (owner_id, status, type, name, address, district, cuisine, rating, price, would_return, notes, url, lat, lng, created_at, updated_at)
select
  u.id, v.status, v.type, v.name, v.address, v.district, v.cuisine,
  v.rating::smallint, v.price::smallint, v.would_return, v.notes, v.url,
  v.lat::double precision, v.lng::double precision, v.created_at::timestamptz, v.updated_at::timestamptz
from u cross join v
where not exists (
  select 1 from public.places p where p.owner_id = u.id and p.name = v.name
);`);
out.push('');
out.push('commit;');
out.push('');
out.push(`-- Összesítő
select status, count(*) as darab
from public.places
where owner_id = (select id from public.profiles where username = '${username}')
group by status;`);

process.stdout.write(out.join('\n') + '\n');
