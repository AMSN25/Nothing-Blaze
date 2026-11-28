-- Ratings are meant to be visible to every visitor, not only to their author.
drop policy if exists "ratings_select_own_or_admin" on public.ratings;
create policy "ratings_select_public" on public.ratings
  for select using (true);
