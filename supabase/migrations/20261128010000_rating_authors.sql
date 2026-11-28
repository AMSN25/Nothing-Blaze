-- Denormalize rating authors so reviews can display names without exposing profiles.
alter table public.ratings
  add column if not exists author_name text not null default '',
  add column if not exists author_avatar text not null default '';
