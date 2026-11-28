-- Continue Watching: remember how far a title got and where to resume.
alter table public.watch_history
  add column if not exists progress smallint not null default 0,
  add column if not exists season smallint,
  add column if not exists episode smallint;

alter table public.watch_history
  drop constraint if exists watch_history_progress_range;

alter table public.watch_history
  add constraint watch_history_progress_range
  check (progress >= 0 and progress <= 100);
