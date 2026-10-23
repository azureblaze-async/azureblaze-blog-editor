<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Data lives in the user's own Supabase project via `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (not Lovable Cloud); schema + RLS live in `database/schema.sql`. Why: user deploys from GitHub and supplies env vars there.
- All post reads/writes go through `src/lib/posts.ts`; admin access is enforced by RLS via `public.is_admin()` + `admin_users` allowlist. Why: keeps provider code isolated and security in the database.
- Article search and social metadata use separate post columns, with additive SQL upgrades for existing installations; the separate public website owns tag rendering. Why: preserves differing search/social copy without changing editor page metadata or rebuilding the public site.
- Article body is Markdown rendered only by `src/components/Markdown.tsx` (raw HTML skipped), shared by public page and editor preview.
- New images use server-authorized R2 presigned PUTs and verified public URLs; legacy Supabase paths still resolve. Why: keeps uploads off the app server and preserves older posts without a schema migration.
- Image server functions attach the existing Supabase bearer through function middleware and verify identity plus is_admin() server-side with the public key. Why: R2 secrets cannot be exercised by unauthenticated or non-admin callers.
