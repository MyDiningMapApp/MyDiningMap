-- MyDiningMap – 2. szakasz: barátok és profilok láthatósága
--
-- Szabályok:
-- - Profilt csak PONTOS felhasználónévre lehet megtalálni (search_profile).
-- - Barátság: az egyik fél jelöl, a másik elfogad; utána kölcsönösen látják egymás helyeit.
-- - Más felhasználó helyei csak a get_profile_places függvényen át olvashatók, és csak akkor,
--   ha a profil publikus, vagy barátok vagytok. Így nem lehet egyszerre lekérni az összes
--   publikus felhasználó helyeit, és a „csak pontos névre” szabály az adatbázisban is érvényes.
-- - A `places` és `profiles` táblák RLS-szabályai nem változnak: közvetlenül továbbra is
--   mindenki csak a saját sorait éri el.

-- ---------------------------------------------------------------------------
-- Barátságok
-- ---------------------------------------------------------------------------
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    constraint friendships_status_values
    check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friendships_not_self check (requester_id <> addressee_id)
);

-- Egy párnak csak egy kapcsolata lehet, függetlenül attól, ki jelölt kit.
create unique index friendships_pair_key
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_requester_idx on public.friendships (requester_id);
create index friendships_addressee_idx on public.friendships (addressee_id);

alter table public.friendships enable row level security;

create policy "Saját kapcsolatok olvasása"
  on public.friendships for select
  to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

-- Írni csak az alábbi függvényeken keresztül lehet.
revoke all on public.friendships from anon, authenticated;
grant select on public.friendships to authenticated;

-- ---------------------------------------------------------------------------
-- Segédfüggvények
-- ---------------------------------------------------------------------------

-- A bejelentkezett felhasználó kapcsolata egy másik felhasználóval:
-- 'self' | 'friends' | 'outgoing' (én jelöltem) | 'incoming' (ő jelölt) | 'none'
create or replace function public.relationship_with(p_user uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_user = auth.uid() then 'self'
    else coalesce((
      select case
        when f.status = 'accepted' then 'friends'
        when f.requester_id = auth.uid() then 'outgoing'
        else 'incoming'
      end
      from public.friendships f
      where (f.requester_id = auth.uid() and f.addressee_id = p_user)
         or (f.requester_id = p_user and f.addressee_id = auth.uid())
    ), 'none')
  end;
$$;

-- ---------------------------------------------------------------------------
-- Keresés és profilok
-- ---------------------------------------------------------------------------

-- Profil pontos felhasználónévre (kis-/nagybetű és kezdő @ nem számít).
create or replace function public.search_profile(p_username text)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  visibility text,
  relationship text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.visibility,
         public.relationship_with(p.id)
  from public.profiles p
  where auth.uid() is not null
    and p.username = lower(ltrim(trim(p_username), '@'));
$$;

-- Az összes kapcsolatom (barátok, bejövő és elküldött jelölések) a másik fél profiljával.
create or replace function public.list_friendships()
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  visibility text,
  relationship text,
  since timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.visibility,
         case
           when f.status = 'accepted' then 'friends'
           when f.requester_id = auth.uid() then 'outgoing'
           else 'incoming'
         end,
         coalesce(f.responded_at, f.created_at)
  from public.friendships f
  join public.profiles p
    on p.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  where auth.uid() in (f.requester_id, f.addressee_id)
  order by p.username;
$$;

-- Egy felhasználó helyei, ha láthatók: saját, barát, vagy publikus profil.
-- Különben üres lista.
create or replace function public.get_profile_places(p_user uuid)
returns setof public.places
language sql
stable
security definer
set search_path = ''
as $$
  select pl.*
  from public.places pl
  join public.profiles pr on pr.id = pl.owner_id
  where pl.owner_id = p_user
    and auth.uid() is not null
    and (
      pr.id = auth.uid()
      or pr.visibility = 'public'
      or public.relationship_with(pr.id) = 'friends'
    )
  order by pl.created_at desc;
$$;

-- ---------------------------------------------------------------------------
-- Jelölések kezelése
-- ---------------------------------------------------------------------------

-- Jelölés küldése. Ha a másik már jelölt engem, automatikusan elfogadja.
-- Visszaadja az új kapcsolatot ('outgoing' vagy 'friends').
create or replace function public.send_friend_request(p_user uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  rel text;
begin
  if me is null then
    raise exception 'Nincs bejelentkezve.';
  end if;
  if p_user = me then
    raise exception 'Saját magadat nem jelölheted be.';
  end if;
  if not exists (select 1 from public.profiles where id = p_user and username is not null) then
    raise exception 'Nincs ilyen felhasználó.';
  end if;

  rel := public.relationship_with(p_user);
  if rel = 'incoming' then
    update public.friendships
      set status = 'accepted', responded_at = now()
      where requester_id = p_user and addressee_id = me;
    return 'friends';
  elsif rel in ('friends', 'outgoing') then
    return rel;
  end if;

  insert into public.friendships (requester_id, addressee_id) values (me, p_user);
  return 'outgoing';
end;
$$;

-- Bejövő jelölés elfogadása (p_accept = true) vagy elutasítása (false).
create or replace function public.respond_friend_request(p_user uuid, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Nincs bejelentkezve.';
  end if;
  if p_accept then
    update public.friendships
      set status = 'accepted', responded_at = now()
      where requester_id = p_user and addressee_id = me and status = 'pending';
  else
    delete from public.friendships
      where requester_id = p_user and addressee_id = me and status = 'pending';
  end if;
  return public.relationship_with(p_user);
end;
$$;

-- Elküldött jelölés visszavonása vagy barátság megszüntetése.
create or replace function public.remove_friendship(p_user uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Nincs bejelentkezve.';
  end if;
  delete from public.friendships
    where (requester_id = me and addressee_id = p_user)
       or (requester_id = p_user and addressee_id = me);
  return 'none';
end;
$$;

-- ---------------------------------------------------------------------------
-- Jogosultságok: a függvényeket csak bejelentkezett felhasználó hívhatja.
-- ---------------------------------------------------------------------------
revoke all on function public.relationship_with(uuid) from public, anon;
revoke all on function public.search_profile(text) from public, anon;
revoke all on function public.list_friendships() from public, anon;
revoke all on function public.get_profile_places(uuid) from public, anon;
revoke all on function public.send_friend_request(uuid) from public, anon;
revoke all on function public.respond_friend_request(uuid, boolean) from public, anon;
revoke all on function public.remove_friendship(uuid) from public, anon;

grant execute on function public.relationship_with(uuid) to authenticated;
grant execute on function public.search_profile(text) to authenticated;
grant execute on function public.list_friendships() to authenticated;
grant execute on function public.get_profile_places(uuid) to authenticated;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.remove_friendship(uuid) to authenticated;
