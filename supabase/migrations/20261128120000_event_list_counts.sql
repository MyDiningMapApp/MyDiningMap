-- Események listája: válaszonkénti létszámok (jön / talán / nem jön / még nem válaszolt),
-- hogy a lista kártyáján összesítő jelenhessen meg.
--
-- A függvény visszatérési típusa változik, ezért előbb törölni kell a régit.
-- Adatot nem érint.

drop function if exists public.list_my_events();

create function public.list_my_events()
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
  maybe_count int,
  declined_count int,
  pending_count int,
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
    (select count(*)::int from public.event_invitees i where i.event_id = e.id and i.response = 'maybe'),
    (select count(*)::int from public.event_invitees i where i.event_id = e.id and i.response = 'declined'),
    (select count(*)::int from public.event_invitees i where i.event_id = e.id and i.response = 'pending'),
    (select count(*)::int from public.event_invitees i where i.event_id = e.id),
    exists (select 1 from public.event_invitees i where i.event_id = e.id and i.suggested_time is not null)
  from public.events e
  join public.profiles org on org.id = e.organizer_id
  where public.is_event_member(e.id)
  order by e.starts_at;
$$;

revoke all on function public.list_my_events() from public, anon;
grant execute on function public.list_my_events() to authenticated;
