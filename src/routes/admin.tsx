import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, LayoutGrid, LogOut, PenLine } from "lucide-react";
import { LogoMark, SetupNotice } from "@/components/site";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isCurrentUserAdmin } from "@/lib/posts";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (supabase && !(await isCurrentUserAdmin())) {
      throw redirect({ to: "/admin/login", search: { redirect: location.href } });
    }
  },
  head: () => ({ meta: [{ title: "AzureBlaze Studio — Blog editor" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutGrid, exact: true },
  { to: "/admin/posts", label: "Posts", icon: FileText, exact: true },
  { to: "/admin/posts/new", label: "New article", icon: PenLine, exact: true },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase?.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  };
  const nav = "flex items-center gap-2.5 border-l-2 border-transparent px-5 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground";
  const active = "!border-primary bg-azure-dim !text-primary";
  return (
    <div className="studio min-h-screen md:pl-60">
      <aside className="z-30 flex flex-col border-b border-border bg-surface md:fixed md:inset-y-0 md:left-0 md:w-60 md:border-b-0 md:border-r">
        <Link to="/admin" className="flex items-center gap-2.5 px-5 py-5">
          <LogoMark />
          <div>
            <div className="font-display text-sm font-bold tracking-[0.16em]">AZUREBLAZE</div>
            <div className="text-[10px] text-faint">Studio</div>
          </div>
        </Link>
        <div className="hidden px-5 pb-2 pt-4 text-[10px] uppercase tracking-[0.16em] text-faint md:block">Publishing</div>
        <nav className="flex overflow-x-auto md:flex-col">
          {items.map((i) => (
            <Link key={i.to} to={i.to} activeOptions={{ exact: i.exact }} className={nav} activeProps={{ className: active }}>
              <i.icon className="h-3.5 w-3.5" />
              <span className="whitespace-nowrap">{i.label}</span>
            </Link>
          ))}
          <button onClick={signOut} className={`${nav} md:hidden`}>
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </nav>
        <div className="mt-auto hidden border-t border-border p-5 md:block">
          <button onClick={signOut} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </aside>
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-10">
        {!isSupabaseConfigured && <SetupNotice />}
        <Outlet />
      </main>
    </div>
  );
}
