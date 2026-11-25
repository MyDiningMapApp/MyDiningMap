-- MyDiningMap – 3. szakasz: események
--
-- Szabályok:
-- - Eseményt csak barátoknak lehet küldeni; egy eseményt csak a szervező és a meghívottak látnak.
-- - A szervező egy időpontot ad meg, és egy vagy több helyet javasol (csak ő adhat hozzá helyet).
-- - A résztvevők (a szervező is) több helyre is szavazhatnak; a végső helyet a szervező választja ki.
--   Ha csak egy hely van, az automatikusan ki van választva.
-- - A meghívott válasza: jövök / talán / nem jövök; javasolhat másik időpontot.
-- - Ha a szervező módosítja az időpontot, a válaszok nullázódnak.
-- - A táblákba közvetlenül írni nem lehet, minden módosítás az alábbi függvényeken megy.

-- ---------------------------------------------------------------------------
-- Táblák
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null
    constraint events_title_length check (char_length(title) between 1 and 100),
  starts_at timestamptz not null,
  note text
    constraint events_note_length check (char_length(note) <= 1000),
  chosen_option_id uuid,
  status text not null default 'active'
    constraint events_status_values check (status in ('active', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_organizer_idx on public.events (organizer_id);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create table public.event_invitees (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  response text not null default 'pending'
    constraint event_invitees_response_values
    check (response in ('pending', 'going', 'maybe', 'declined')),
  suggested_time timestamptz,
  comment text
    constraint event_invitees_comment_length check (char_length(comment) <= 300),
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (event_id, user_id)
);

create index event_invitees_user_idx on public.event_invitees (user_id);

create table public.event_place_options (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null
    constraint event_place_options_name_length check (char_length(name) between 1 and 200),
  address text,
  district text,
  lat double precision,
  lng double precision,
  -- Ha valakinek a listájáról jött; ha az a hely törlődik, a javaslat megmarad.
  source_place_id uuid references public.places (id) on delete set null,
  created_at timestamptz not null default now()
);

create index event_place_options_event_idx on public.event_place_options (event_id);

alter table public.events
  add constraint events_chosen_option_fk
  foreign key (chosen_option_id) references public.event_place_options (id) on delete set null;

create table public.event_votes (
  option_id uuid not null references public.event_place_options (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (option_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Segédfüggvények
-- ---------------------------------------------------------------------------

-- Tagja-e a bejelentkezett felhasználó az eseménynek (szervező vagy meghívott)?
create or replace function public.is_event_member(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    exists (select 1 from public.events where id = p_event and organizer_id = auth.uid())
    or exists (select 1 from public.event_invitees where event_id = p_event and user_id = auth.uid())
  );
$$;

-- A bejelentkezett felhasználó szervezi-e az (aktív) eseményt? Különben hibát dob.
create or replace function public.assert_event_organizer(p_event uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.events
    where id = p_event and organizer_id = auth.uid() and status = 'active'
  ) then
    raise exception 'Ezt csak az esemény szervezője teheti meg (lemondott eseménynél semmit).';
  end if;
end;
$$;

-- Egy javasolt hely felvétele (a szervező ellenőrzése után hívjuk).
create or replace function public.insert_event_option(p_event uuid, p_option jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_source uuid := nullif(p_option->>'source_place_id', '')::uuid;
  v_owner uuid;
begin
  if coalesce(trim(p_option->>'name'), '') = '' then
    raise exception 'A javasolt helynek nevet kell adni.';
  end if;
  -- Csak olyan helyre lehet hivatkozni, amit a szervező lát.
  if v_source is not null then
    select owner_id into v_owner from public.places where id = v_source;
    if v_owner is null or not public.can_view_places_of(v_owner) then
      v_source := null;
    end if;
  end if;
  insert into public.event_place_options (event_id, name, address, district, lat, lng, source_place_id)
  values (
    p_event,
    trim(p_option->>'name'),
    nullif(trim(p_option->>'address'), ''),
    nullif(p_option->>'district', ''),
    (p_option->>'lat')::double precision,
    (p_option->>'lng')::double precision,
    v_source
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- Meghívottak felvétele: csak a szervező barátai, a szervező kivételével.
create or replace function public.insert_event_invitees(p_event uuid, p_users uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  u uuid;
begin
  foreach u in array coalesce(p_users, '{}') loop
    if u = auth.uid() then
      continue;
    end if;
    if public.relationship_with(u) <> 'friends' then
      raise exception 'Csak a barátaidat hívhatod meg.';
    end if;
    insert into public.event_invitees (event_id, user_id)
    values (p_event, u)
    on conflict do nothing;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Olvasási jogok: csak a tagok látják az eseményt és a hozzá tartozó adatokat.
-- ---------------------------------------------------------------------------
alter table public.events enable row level security;
alter table public.event_invitees enable row level security;
alter table public.event_place_options enable row level security;
alter table public.event_votes enable row level security;

create policy "Esemény olvasása tagként" on public.events
  for select to authenticated using (public.is_event_member(id));
create policy "Meghívottak olvasása tagként" on public.event_invitees
  for select to authenticated using (public.is_event_member(event_id));
create policy "Javasolt helyek olvasása tagként" on public.event_place_options
  for select to authenticated using (public.is_event_member(event_id));
create policy "Szavazatok olvasása tagként" on public.event_votes
  for select to authenticated using (
    public.is_event_member((select o.event_id from public.event_place_options o where o.id = option_id))
  );

revoke all on public.events, public.event_invitees, public.event_place_options, public.event_votes
  from anon, authenticated;
grant select on public.events, public.event_invitees, public.event_place_options, public.event_votes
  to authenticated;

-- ---------------------------------------------------------------------------
-- Műveletek
-- ---------------------------------------------------------------------------

-- Esemény létrehozása. p_options: [{name, address, district, lat, lng, source_place_id}, ...]
create or replace function public.create_event(
  p_title text,
  p_starts_at timestamptz,
  p_note text,
  p_invitees uuid[],
  p_options jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event uuid;
  v_option jsonb;
  v_first uuid;
  v_count int := 0;
begin
  if auth.uid() is null then
    raise exception 'Nincs bejelentkezve.';
  end if;
  if coalesce(trim(p_title), '') = '' then
    raise exception 'Add meg az esemény címét.';
  end if;
  if p_starts_at is null or p_starts_at < now() - interval '1 hour' then
    raise exception 'Az esemény időpontja nem lehet a múltban.';
  end if;
  if coalesce(array_length(p_invitees, 1), 0) = 0 then
    raise exception 'Hívj meg legalább egy barátot.';
  end if;
  if jsonb_typeof(p_options) <> 'array' or jsonb_array_length(p_options) = 0 then
    raise exception 'Javasolj legalább egy helyet.';
  end if;

  insert into public.events (organizer_id, title, starts_at, note)
  values (auth.uid(), trim(p_title), p_starts_at, nullif(trim(p_note), ''))
  returning id into v_event;

  perform public.insert_event_invitees(v_event, p_invitees);

  for v_option in select * from jsonb_array_elements(p_options) loop
    v_count := v_count + 1;
    if v_count = 1 then
      v_first := public.insert_event_option(v_event, v_option);
    else
      perform public.insert_event_option(v_event, v_option);
    end if;
  end loop;

  -- Egyetlen javasolt hely esetén az a kiválasztott.
  if v_count = 1 then
    update public.events set chosen_option_id = v_first where id = v_event;
  end if;

  return v_event;
end;
$$;

-- Cím, időpont, megjegyzés módosítása (szervező). Időpont-változáskor a válaszok nullázódnak.
create or replace function public.update_event(
  p_event uuid,
  p_title text,
  p_starts_at timestamptz,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old timestamptz;
begin
  perform public.assert_event_organizer(p_event);
  if coalesce(trim(p_title), '') = '' then
    raise exception 'Add meg az esemény címét.';
  end if;
  select starts_at into v_old from public.events where id = p_event;
  update public.events
    set title = trim(p_title), starts_at = p_starts_at, note = nullif(trim(p_note), '')
    where id = p_event;
  if p_starts_at is distinct from v_old then
    update public.event_invitees
      set response = 'pending', suggested_time = null, responded_at = null
      where event_id = p_event;
  end if;
end;
$$;

-- További barátok meghívása (szervező).
create or replace function public.add_event_invitees(p_event uuid, p_users uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_event_organizer(p_event);
  perform public.insert_event_invitees(p_event, p_users);
end;
$$;

-- Új javasolt hely (szervező).
create or replace function public.add_event_option(p_event uuid, p_option jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_event_organizer(p_event);
  return public.insert_event_option(p_event, p_option);
end;
$$;

-- Javasolt hely törlése (szervező). Az utolsó helyet nem lehet törölni.
create or replace function public.remove_event_option(p_option uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event uuid;
begin
  select event_id into v_event from public.event_place_options where id = p_option;
  if v_event is null then
    raise exception 'Nincs ilyen javasolt hely.';
  end if;
  perform public.assert_event_organizer(v_event);
  if (select count(*) from public.event_place_options where event_id = v_event) <= 1 then
    raise exception 'Legalább egy javasolt helynek maradnia kell.';
  end if;
  delete from public.event_place_options where id = p_option;
end;
$$;

-- A végső hely kiválasztása (szervező); null = újra szavazás.
create or replace function public.choose_event_option(p_event uuid, p_option uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_event_organizer(p_event);
  if p_option is not null and not exists (
    select 1 from public.event_place_options where id = p_option and event_id = p_event
  ) then
    raise exception 'Ez a hely nem ehhez az eseményhez tartozik.';
  end if;
  update public.events set chosen_option_id = p_option where id = p_event;
end;
$$;

-- Válasz a meghívóra (meghívott). p_suggested_time: javasolt másik időpont (vagy null).
create or replace function public.respond_event(
  p_event uuid,
  p_response text,
  p_suggested_time timestamptz,
  p_comment text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.event_invitees i join public.events e on e.id = i.event_id
    where i.event_id = p_event and i.user_id = auth.uid() and e.status = 'active'
  ) then
    raise exception 'Erre az eseményre nem kaptál meghívót, vagy már lemondták.';
  end if;
  if p_response not in ('pending', 'going', 'maybe', 'declined') then
    raise exception 'Érvénytelen válasz.';
  end if;
  update public.event_invitees
    set response = p_response,
        suggested_time = p_suggested_time,
        comment = nullif(trim(p_comment), ''),
        responded_at = now()
    where event_id = p_event and user_id = auth.uid();
end;
$$;

-- Szavazat egy javasolt helyre (bármely tag); p_vote = false visszavonja.
create or replace function public.set_event_vote(p_option uuid, p_vote boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event uuid;
begin
  select event_id into v_event from public.event_place_options where id = p_option;
  if v_event is null or not public.is_event_member(v_event) then
    raise exception 'Nincs ilyen javasolt hely.';
  end if;
  if not exists (select 1 from public.events where id = v_event and status = 'active') then
    raise exception 'Ez az esemény már le van mondva.';
  end if;
  if p_vote then
    insert into public.event_votes (option_id, user_id) values (p_option, auth.uid())
    on conflict do nothing;
  else
    delete from public.event_votes where option_id = p_option and user_id = auth.uid();
  end if;
end;
$$;

-- Esemény lemondása (szervező).
create or replace function public.cancel_event(p_event uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_event_organizer(p_event);
  update public.events set status = 'cancelled' where id = p_event;
end;
$$;

-- ---------------------------------------------------------------------------
-- Lekérdezések
-- ---------------------------------------------------------------------------

-- Az összes eseményem (szervezőként vagy meghívottként), összesítő adatokkal a listához.
create or replace function public.list_my_events()
returns table (
  id uuid,
  title text,
  starts_at timestamptz,
  status text,
  is_organizer boolean,
  organizer_username text,
  organizer_display_name text,
  my_response text,
  chosen_place text,
  option_count int,
  going_count int,
  invitee_count int,
  has_suggestions boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.id, e.title, e.starts_at, e.status,
    e.organizer_id = auth.uid(),
    org.username, org.display_name,
    (select i.response from public.event_invitees i where i.event_id = e.id and i.user_id = auth.uid()),
    (select o.name from public.event_place_options o where o.id = e.chosen_option_id),
    (select count(*)::int from public.event_place_options o where o.event_id = e.id),
    (select count(*)::int from public.event_invitees i where i.event_id = e.id and i.response = 'going'),
    (select count(*)::int from public.event_invitees i where i.event_id = e.id),
    exists (select 1 from public.event_invitees i where i.event_id = e.id and i.suggested_time is not null)
  from public.events e
  join public.profiles org on org.id = e.organizer_id
  where public.is_event_member(e.id)
  order by e.starts_at;
$$;

-- Egy esemény minden adata egyben (csak tagoknak; különben null).
create or replace function public.get_event(p_event uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when not public.is_event_member(e.id) then null else jsonb_build_object(
    'id', e.id,
    'title', e.title,
    'starts_at', e.starts_at,
    'note', e.note,
    'status', e.status,
    'chosen_option_id', e.chosen_option_id,
    'is_organizer', e.organizer_id = auth.uid(),
    'organizer', (
      select jsonb_build_object('id', p.id, 'username', p.username, 'display_name', p.display_name)
      from public.profiles p where p.id = e.organizer_id
    ),
    'invitees', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'username', p.username, 'display_name', p.display_name,
        'response', i.response, 'suggested_time', i.suggested_time, 'comment', i.comment,
        'responded_at', i.responded_at
      ) order by p.username)
      from public.event_invitees i join public.profiles p on p.id = i.user_id
      where i.event_id = e.id
    ), '[]'::jsonb),
    'options', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id, 'name', o.name, 'address', o.address, 'district', o.district,
        'lat', o.lat, 'lng', o.lng, 'source_place_id', o.source_place_id,
        'votes', (select count(*) from public.event_votes v where v.option_id = o.id),
        'my_vote', exists (
          select 1 from public.event_votes v where v.option_id = o.id and v.user_id = auth.uid()
        ),
        'voters', coalesce((
          select jsonb_agg(p.username order by p.username)
          from public.event_votes v join public.profiles p on p.id = v.user_id
          where v.option_id = o.id
        ), '[]'::jsonb)
      ) order by o.created_at)
      from public.event_place_options o where o.event_id = e.id
    ), '[]'::jsonb)
  ) end
  from public.events e
  where e.id = p_event;
$$;

-- ---------------------------------------------------------------------------
-- Jogosultságok: a belső segédfüggvényeket senki nem hívhatja közvetlenül,
-- a többit csak bejelentkezett felhasználó.
-- ---------------------------------------------------------------------------
revoke all on function public.is_event_member(uuid) from public, anon;
revoke all on function public.assert_event_organizer(uuid) from public, anon, authenticated;
revoke all on function public.insert_event_option(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.insert_event_invitees(uuid, uuid[]) from public, anon, authenticated;
revoke all on function public.create_event(text, timestamptz, text, uuid[], jsonb) from public, anon;
revoke all on function public.update_event(uuid, text, timestamptz, text) from public, anon;
revoke all on function public.add_event_invitees(uuid, uuid[]) from public, anon;
revoke all on function public.add_event_option(uuid, jsonb) from public, anon;
revoke all on function public.remove_event_option(uuid) from public, anon;
revoke all on function public.choose_event_option(uuid, uuid) from public, anon;
revoke all on function public.respond_event(uuid, text, timestamptz, text) from public, anon;
revoke all on function public.set_event_vote(uuid, boolean) from public, anon;
revoke all on function public.cancel_event(uuid) from public, anon;
revoke all on function public.list_my_events() from public, anon;
revoke all on function public.get_event(uuid) from public, anon;

grant execute on function public.is_event_member(uuid) to authenticated;
grant execute on function public.create_event(text, timestamptz, text, uuid[], jsonb) to authenticated;
grant execute on function public.update_event(uuid, text, timestamptz, text) to authenticated;
grant execute on function public.add_event_invitees(uuid, uuid[]) to authenticated;
grant execute on function public.add_event_option(uuid, jsonb) to authenticated;
grant execute on function public.remove_event_option(uuid) to authenticated;
grant execute on function public.choose_event_option(uuid, uuid) to authenticated;
grant execute on function public.respond_event(uuid, text, timestamptz, text) to authenticated;
grant execute on function public.set_event_vote(uuid, boolean) to authenticated;
grant execute on function public.cancel_event(uuid) to authenticated;
grant execute on function public.list_my_events() to authenticated;
grant execute on function public.get_event(uuid) to authenticated;
