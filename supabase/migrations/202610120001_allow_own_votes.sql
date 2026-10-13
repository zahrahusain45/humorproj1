begin;
drop policy "Vote as yourself on someone else's caption" on public.humor_votes;
create policy "Vote as yourself" on public.humor_votes
  for insert to authenticated with check (user_id = (select auth.uid()) and exists (select 1 from public.humor_captions c where c.id = caption_id));
commit;
