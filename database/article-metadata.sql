-- Run once in your existing Supabase project's SQL Editor before deploying the updated editor.
-- Additive and safe to re-run: preserves articles, grants and existing RLS policies.
alter table public.posts
  add column if not exists og_title text,
  add column if not exists og_description text,
  add column if not exists tags text[] not null default '{}';

notify pgrst, 'reload schema';