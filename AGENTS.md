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
- Article body is Markdown rendered only by `src/components/Markdown.tsx` (raw HTML skipped), shared by public page and editor preview.
