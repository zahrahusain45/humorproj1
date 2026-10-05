-- Apply in the existing project's Supabase SQL Editor or with `supabase db push`.
-- This migration never deletes existing data.
begin;

create table public.humor_generation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now(),
  unique (id, user_id)
);
create index humor_generation_requests_user_time on public.humor_generation_requests(user_id, requested_at);

create table public.humor_captions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null unique,
  scene_id text not null check (scene_id in ('subway', 'library', 'bagel', 'dorm')),
  image_path text not null,
  caption text not null check (char_length(caption) between 1 and 500),
  user_prompt text not null check (char_length(user_prompt) between 5 and 500),
  prompt text not null check (char_length(prompt) between 1 and 3000),
  system_prompt text not null check (char_length(system_prompt) between 1 and 3000),
  style text not null check (style in ('Deadpan', 'Chronically online', 'Wholesome')),
  model text not null check (char_length(model) between 1 and 100),
  generation_config jsonb not null,
  created_at timestamptz not null default now(),
  foreign key (request_id, user_id) references public.humor_generation_requests(id, user_id),
  check (image_path = '/jokes/' || scene_id || '.svg')
);
create index humor_captions_created on public.humor_captions(created_at desc);
create index humor_captions_user on public.humor_captions(user_id);

create table public.humor_votes (
  id uuid primary key default gen_random_uuid(),
  caption_id uuid not null references public.humor_captions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (caption_id, user_id)
);
create index humor_votes_user on public.humor_votes(user_id);

-- Enable RLS for every existing table in the application schema, including legacy tables.
-- Do not alter Supabase-managed auth/storage schemas.
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

revoke all on public.humor_generation_requests, public.humor_captions, public.humor_votes from public, anon, authenticated;
grant select on public.humor_generation_requests to authenticated;
grant select, insert on public.humor_captions, public.humor_votes to authenticated;
-- Prevent forged timestamps/IDs and updates/deletes through the Data API.
revoke insert on public.humor_captions, public.humor_votes from authenticated;
grant insert (user_id, request_id, scene_id, image_path, caption, user_prompt, prompt, system_prompt, style, model, generation_config) on public.humor_captions to authenticated;
grant insert (caption_id, user_id, value) on public.humor_votes to authenticated;

create policy "Read own generation reservations" on public.humor_generation_requests
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Logged-in users read captions" on public.humor_captions
  for select to authenticated using ((select auth.uid()) is not null);
create policy "Insert own reserved caption" on public.humor_captions
  for insert to authenticated with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.humor_generation_requests r
      where r.id = request_id and r.user_id = (select auth.uid())
        and r.requested_at > now() - interval '5 minutes'
    )
  );
create policy "Read own votes only" on public.humor_votes
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Vote as yourself on someone else's caption" on public.humor_votes
  for insert to authenticated with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.humor_captions c
      where c.id = caption_id and c.user_id <> (select auth.uid())
    )
  );

-- Narrow security-definer functions: no arbitrary SQL, fixed search_path, explicit identity.
-- A user cannot create reservations directly, choose another identity, or exceed the cap.
create function public.reserve_humor_generation() returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  reservation uuid;
  day_start timestamptz := date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York';
begin
  if caller is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(caller::text, 0));
  if (select count(*) from public.humor_generation_requests where user_id = caller and requested_at >= day_start) >= 10 then
    raise exception 'daily generation limit reached';
  end if;
  insert into public.humor_generation_requests(user_id) values (caller) returning id into reservation;
  return reservation;
end;
$$;
revoke all on function public.reserve_humor_generation() from public, anon;
grant execute on function public.reserve_humor_generation() to authenticated;

-- Return aggregate counts only, never another voter's identity or individual vote.
-- Bound the requested IDs so the feed does not require an unbounded full-table scan.
create function public.humor_vote_counts(caption_ids uuid[])
returns table(caption_id uuid, upvotes bigint, downvotes bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if coalesce(cardinality(caption_ids), 0) > 60 then raise exception 'Too many caption IDs'; end if;
  return query
    select c.id,
      count(v.id) filter (where v.value = 1),
      count(v.id) filter (where v.value = -1)
    from public.humor_captions c
    left join public.humor_votes v on v.caption_id = c.id
    where c.id = any(caption_ids)
    group by c.id;
end;
$$;
revoke all on function public.humor_vote_counts(uuid[]) from public, anon;
grant execute on function public.humor_vote_counts(uuid[]) to authenticated;

-- The old movies/profile UI is removed. Preserve its data but close Data API access.
-- Other existing tables retain their policies; inspect them with the audit query below.
do $$
declare legacy text;
begin
  foreach legacy in array array['movies', 'profiles'] loop
    if to_regclass('public.' || legacy) is not null then
      execute format('revoke all on public.%I from anon, authenticated', legacy);
    end if;
  end loop;
end $$;

commit;

-- Audit after applying. Every application table should show rls_enabled = true.
select schemaname, tablename, rowsecurity as rls_enabled from pg_tables where schemaname = 'public';
select tablename, policyname, roles, cmd, qual, with_check from pg_policies where schemaname = 'public';
