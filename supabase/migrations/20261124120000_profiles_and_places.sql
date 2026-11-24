-- MyDiningMap – 1. szakasz: profilok és helyek
--
-- Ebben a szakaszban mindenki csak a SAJÁT profilját és helyeit éri el.
-- A barátok és a publikus profilok láthatósága a 2. szakaszban jön.
--
-- A projektben ki van kapcsolva az automatikus API-hozzáférés az új táblákhoz,
-- ezért a jogokat (GRANT) itt, táblánként adjuk meg. Bejelentkezés nélkül (anon szerep)
-- semmit nem lehet elérni.

-- ---------------------------------------------------------------------------
-- Közös segédfüggvény: updated_at automatikus frissítése
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profilok
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Regisztráció után még üres; az első belépéskor választja ki a felhasználó.
  username text unique
    constraint profiles_username_format
    check (username ~ '^[a-z0-9._]{3,30}$'),
  display_name text
    constraint profiles_display_name_length
    check (char_length(display_name) between 1 and 60),
  avatar_url text,
  visibility text not null default 'private'
    constraint profiles_visibility_values
    check (visibility in ('private', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.username is
  'Egyedi felhasználónév: kisbetű, szám, pont, aláhúzás; 3–30 karakter.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Regisztrációkor automatikusan létrejön a profil.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Saját profil olvasása"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Saját profil módosítása"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Beszúrás a triggerrel történik, törlés a fiók törlésével (cascade).
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (username, display_name, avatar_url, visibility) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Helyek
-- ---------------------------------------------------------------------------
create table public.places (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  status text not null default 'visited'
    constraint places_status_values
    check (status in ('visited', 'wishlist')),
  type text not null default 'etterem'
    constraint places_type_values
    check (type in ('etterem', 'bar', 'kocsma', 'kavezo', 'pekseg', 'cukraszda')),
  name text not null
    constraint places_name_length
    check (char_length(name) between 1 and 200),
  address text,
  district text
    constraint places_district_values
    check (district in ('I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
      'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII')),
  cuisine text,
  rating smallint
    constraint places_rating_range
    check (rating between 1 and 10),
  price smallint
    constraint places_price_range
    check (price between 1 and 4),
  would_return boolean not null default false,
  notes text,
  url text,
  lat double precision
    constraint places_lat_range
    check (lat between -90 and 90),
  lng double precision
    constraint places_lng_range
    check (lng between -180 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index places_owner_id_idx on public.places (owner_id);

create trigger places_set_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();

alter table public.places enable row level security;

create policy "Saját helyek olvasása"
  on public.places for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "Saját hely felvétele"
  on public.places for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Saját hely módosítása"
  on public.places for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Saját hely törlése"
  on public.places for delete
  to authenticated
  using (owner_id = (select auth.uid()));

revoke all on public.places from anon, authenticated;
grant select, insert, update, delete on public.places to authenticated;
