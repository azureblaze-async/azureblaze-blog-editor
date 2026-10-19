# AzureBlaze Studio — Blog Editor

A private blog editor for the AzureBlaze blog: write articles in Markdown, preview them,
publish, unpublish, archive and delete, and upload cover images. The public site reads the
same database — it lives in its own repository and is not part of this project.

## Features

- Markdown editor with **write / split / preview** modes and a formatting toolbar
- **Draft → published → archived** lifecycle; publishing is validated (excerpt, category,
  body and a publish date are required) both in the UI and by a database constraint
- Cover and inline image uploads to Cloudflare R2; existing Supabase Storage images remain supported
- Slug generation with a uniqueness check before saving
- Per-article SEO title and description
- Dashboard with post counts, plus a posts list with status filters and search
- Access control enforced by Postgres **row-level security**, not by the UI — a request that
  skips the screens is still rejected by the database

## Stack

React 19 · TanStack Start v1 (Vite 7) · TypeScript · Tailwind CSS v4 · shadcn/ui ·
Supabase (Postgres, Auth, Storage) · Vitest

## R2 image setup

Follow [docs/R2-SETUP.md](docs/R2-SETUP.md) for R2 credentials, public URLs, bucket CORS and Vercel environment variables. New uploads require this setup; existing images are not migrated or deleted.

## Getting started

1. **Install dependencies**

   ```sh
   npm install
   ```

2. **Add your environment variables**

   ```sh
   cp .env.example .env
   ```

   | Variable | Where to find it |
   | --- | --- |
   | `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` / publishable key |

3. **Create the schema, policies and storage bucket** — paste
   [`database/schema.sql`](database/schema.sql) into Supabase → SQL Editor and run it once.

4. **Grant yourself editor access.** There is no public sign-up: admins are allowlisted in
   the database. Create your user in Supabase → Authentication → Users, then run:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

5. **Run it**

   ```sh
   npm run dev
   ```

   Open the URL the dev server prints, then go to `/admin/login` and sign in.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the editor locally |
| `npm run build` | Production build |
| `npm run preview` | Serve the built app |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (covers the post rules in `src/lib/posts.test.ts`) |

## Where things live

| Path | Purpose |
| --- | --- |
| `src/lib/posts.ts` | Every read and write of an article — the only place posts are touched |
| `src/lib/supabase.ts` | Supabase client and the configured/not-configured check |
| `src/components/Markdown.tsx` | Markdown renderer shared by the editor preview and article view |
| `src/components/PostEditor.tsx` | The editor itself |
| `src/routes/admin.*` | Dashboard, posts list, new post, edit post, sign-in |
| `database/schema.sql` | Tables, triggers, storage bucket and all RLS policies |

## Security notes

- `.env` is git-ignored; only `.env.example` is committed. Set the real values in your
  hosting provider's environment rather than committing them.
- This repository is public. The two `VITE_` values above are shipped to the browser by
  design (the `anon` key is a publishable key), but **never** commit a `service_role` /
  secret key here — it bypasses every policy.
- Row-level security: anonymous visitors can only read `published` posts; inserting,
  updating and deleting requires `public.is_admin()`, which checks the `admin_users`
  allowlist.
