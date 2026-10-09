begin;
grant delete on public.humor_captions to authenticated;
create policy "Delete own captions only" on public.humor_captions
  for delete to authenticated using (user_id = (select auth.uid()));
-- Existing caption_id foreign keys cascade votes. Reservations remain for daily limits.
commit;
