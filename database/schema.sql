-- AzureBlaze CMS schema. Paste into Supabase → SQL Editor and run once.

-- ---------- Admin allowlist ----------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
grant select on public.admin_users to authenticated;
grant all on public.admin_users to service_role;
alter table public.admin_users enable row level security;
-- Users only see their own row. No write policies: admins are provisioned via SQL only.
drop policy if exists "read own admin row" on public.admin_users;
create policy "read own admin row" on public.admin_users for select to authenticated using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Posts ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text,
  content_markdown text not null default '',
  category text,
  cover_image_path text,
  cover_image_alt text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  seo_title text,
  seo_description text,
  og_title text,
  og_description text,
  tags text[] not null default '{}',
  social_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_requires_fields check (
    status <> 'published' or (
      excerpt is not null and length(trim(excerpt)) > 0 and
      length(trim(content_markdown)) > 0 and
      category is not null and length(trim(category)) > 0 and
      published_at is not null
    )
  )
);
create index if not exists posts_public_idx on public.posts (status, published_at desc);

-- Upgrade existing installations as well as fresh ones.
alter table public.posts
  add column if not exists og_title text,
  add column if not exists og_description text,
  add column if not exists tags text[] not null default '{}';

grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;

drop policy if exists "public reads published" on public.posts;
create policy "public reads published" on public.posts for select to anon, authenticated using (status = 'published');
drop policy if exists "admin reads all" on public.posts;
create policy "admin reads all" on public.posts for select to authenticated using (public.is_admin());
drop policy if exists "admin inserts" on public.posts;
create policy "admin inserts" on public.posts for insert to authenticated with check (public.is_admin());
drop policy if exists "admin updates" on public.posts;
create policy "admin updates" on public.posts for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin deletes" on public.posts;
create policy "admin deletes" on public.posts for delete to authenticated using (public.is_admin());

-- updated_at on every write; published_at set once on first publication and never reset.
create or replace function public.posts_timestamps()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' and old.published_at is not null then
    new.published_at := old.published_at;
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;
drop trigger if exists posts_timestamps on public.posts;
create trigger posts_timestamps before insert or update on public.posts
  for each row execute function public.posts_timestamps();

-- ---------- Storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('azureblaze-media', 'azureblaze-media', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/gif','image/avif'])
on conflict (id) do nothing;

drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects for select using (bucket_id = 'azureblaze-media');
drop policy if exists "admin upload media" on storage.objects;
create policy "admin upload media" on storage.objects for insert to authenticated with check (bucket_id = 'azureblaze-media' and public.is_admin());
drop policy if exists "admin update media" on storage.objects;
create policy "admin update media" on storage.objects for update to authenticated using (bucket_id = 'azureblaze-media' and public.is_admin());
drop policy if exists "admin delete media" on storage.objects;
create policy "admin delete media" on storage.objects for delete to authenticated using (bucket_id = 'azureblaze-media' and public.is_admin());

-- ---------- Make yourself admin ----------
-- 1. Supabase Dashboard → Authentication → Users → Add user (email + password).
-- 2. Run: insert into public.admin_users (user_id) select id from auth.users where email = 'you@example.com';
