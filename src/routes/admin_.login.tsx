import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogoMark, SetupNotice } from "@/components/site";
import { isCurrentUserAdmin } from "@/lib/posts";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => {
    const r = s["redirect"];
    return typeof r === "string" && r.startsWith("/admin") ? { redirect: r } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — AzureBlaze Studio" },
      { name: "description", content: "Private sign-in for the AzureBlaze publishing studio." },
      { property: "og:title", content: "Sign in — AzureBlaze Studio" },
      { property: "og:description", content: "Private sign-in for the AzureBlaze publishing studio." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError("Invalid credentials.");
      setBusy(false);
      return;
    }
    if (!(await isCurrentUserAdmin())) {
      await supabase.auth.signOut();
      setError("Invalid credentials.");
      setBusy(false);
      return;
    }
    navigate({ to: redirect ?? "/admin", replace: true });
  };

  const field = "w-full rounded-md border border-input bg-surface-2 px-3 py-2.5 text-sm text-foreground outline-none focus:border-azure-border";
  return (
    <div className="studio flex min-h-screen items-center justify-center px-4 hero-glow">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-border bg-surface p-7">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <div>
            <div className="font-display text-sm font-bold tracking-[0.16em]">AZUREBLAZE</div>
            <div className="text-[10px] text-faint">Studio · private</div>
          </div>
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold">Sign in</h1>
        {!isSupabaseConfigured && <SetupNotice />}
        <label className="mt-6 block text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Email</label>
        <input className={`${field} mt-1.5`} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="mt-4 block text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Password</label>
        <input className={`${field} mt-1.5`} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="mt-3 text-xs text-destructive" role="alert">{error}</p>}
        <button disabled={busy || !isSupabaseConfigured} className="mt-6 w-full rounded-md bg-primary py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-primary-foreground disabled:opacity-50">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
