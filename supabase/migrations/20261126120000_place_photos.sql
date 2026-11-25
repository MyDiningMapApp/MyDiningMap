-- MyDiningMap – fotók a helyekhez
--
-- - A fotók a privát `place-photos` tárolóba kerülnek: <tulajdonos id>/<hely id>/<fotó id>.jpg
--   (és mellé egy kicsinyített bélyegkép: ..._thumb.jpg).
-- - Feltölteni és törölni csak a saját helyeihez tud a felhasználó; egy helynek legfeljebb 6 fotója lehet.
-- - Megnézni ugyanazok tudják, akik a helyet is: a tulajdonos, a barátai, és publikus profilnál bárki.
-- - A `place_photos` táblát közvetlenül mindenki csak a sajátjaira látja; más felhasználó
--   fotóit a get_profile_photos függvény adja vissza (ugyanazzal a feltétellel, mint a helyeket).

-- ---------------------------------------------------------------------------
-- Ki láthatja egy felhasználó helyeit (és fotóit)?
-- ---------------------------------------------------------------------------
create or replace function public.can_view_places_of(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    p_user = auth.uid()
    or exists (select 1 from public.profiles where id = p_user and visibility = 'public')
    or public.relationship_with(p_user) = 'friends'
  );
$$;

revoke all on function public.can_view_places_of(uuid) from public, anon;
grant execute on function public.can_view_places_of(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Fotók táblája
-- ---------------------------------------------------------------------------
create table public.place_photos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  path text not null unique,
  thumb_path text not null unique,
  width integer,
  height integer,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  -- A fájlnak a tulajdonos mappájában kell lennie.
  constraint place_photos_path_owner check (split_part(path, '/', 1) = owner_id::text),
  constraint place_photos_thumb_owner check (split_part(thumb_path, '/', 1) = owner_id::text)
);

create index place_photos_place_id_idx on public.place_photos (place_id);
create index place_photos_owner_id_idx on public.place_photos (owner_id);

-- Csak a saját helyhez lehet fotót adni, és egy helynek legfeljebb 6 fotója lehet.
create or replace function public.check_place_photo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.places where id = new.place_id and owner_id = new.owner_id
  ) then
    raise exception 'Csak a saját helyeidhez tölthetsz fel fotót.';
  end if;
  if (select count(*) from public.place_photos where place_id = new.place_id) >= 6 then
    raise exception 'Egy helyhez legfeljebb 6 fotó tölthető fel.';
  end if;
  return new;
end;
$$;

create trigger place_photos_check
  before insert on public.place_photos
  for each row execute function public.check_place_photo();

alter table public.place_photos enable row level security;

create policy "Saját fotók olvasása"
  on public.place_photos for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "Saját fotó felvétele"
  on public.place_photos for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Saját fotó törlése"
  on public.place_photos for delete
  to authenticated
  using (owner_id = (select auth.uid()));

revoke all on public.place_photos from anon, authenticated;
grant select, insert, delete on public.place_photos to authenticated;

-- Egy felhasználó összes fotója (bélyegképekhez és adatlaphoz), ha a helyei láthatók.
create or replace function public.get_profile_photos(p_user uuid)
returns setof public.place_photos
language sql
stable
security definer
set search_path = ''
as $$
  select ph.*
  from public.place_photos ph
  where ph.owner_id = p_user
    and public.can_view_places_of(p_user)
  order by ph.place_id, ph.position, ph.created_at;
$$;

revoke all on function public.get_profile_photos(uuid) from public, anon;
grant execute on function public.get_profile_photos(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Tároló (Storage) és a hozzá tartozó szabályok
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('place-photos', 'place-photos', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;

-- A mappanév (első útvonalelem) a tulajdonos azonosítója.
create policy "Fotó feltöltése a saját mappába"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'place-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Saját fotó törlése a tárolóból"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'place-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Fotó megtekintése, ha a helyek láthatók"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'place-photos'
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and public.can_view_places_of(((storage.foldername(name))[1])::uuid)
  );
