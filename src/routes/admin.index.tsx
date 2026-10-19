import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, StatusBadge, btn } from "@/components/admin-ui";
import { adminCounts, adminListPosts, formatDate } from "@/lib/posts";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const counts = useQuery({ queryKey: ["admin", "counts"], queryFn: adminCounts });
  const recent = useQuery({ queryKey: ["admin", "recent"], queryFn: () => adminListPosts({ pageSize: 6 }) });
  const stats = [
    { label: "Published", value: counts.data?.published, tone: "text-success" },
    { label: "Drafts", value: counts.data?.draft, tone: "text-warning" },
    { label: "Archived", value: counts.data?.archived, tone: "text-muted-foreground" },
  ];
  return (
    <>
      <PageHeader eyebrow="Overview" title="Dashboard" action={<Link to="/admin/posts/new" className={btn.primary}>New article</Link>} />
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-surface p-5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-faint">{s.label}</div>
            <div className={`mt-2 font-display text-4xl font-bold ${s.tone}`}>{s.value ?? "–"}</div>
          </div>
        ))}
      </div>
      <h2 className="mb-3 mt-10 font-display text-lg font-semibold">Recently updated</h2>
      <div className="overflow-hidden rounded-lg border border-border">
        {recent.data?.posts.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No articles yet. <Link to="/admin/posts/new" className="text-primary">Create your first article</Link>
          </div>
        )}
        {recent.data?.posts.map((p) => (
          <Link key={p.id} to="/admin/posts/$id/edit" params={{ id: p.id }} className="flex items-center justify-between gap-4 border-b border-border bg-surface px-5 py-3.5 last:border-b-0 hover:bg-surface-2">
            <div className="min-w-0">
              <div className="truncate text-sm text-foreground">{p.title}</div>
              <div className="text-[11px] text-faint">/{p.slug} · updated {formatDate(p.updated_at)}</div>
            </div>
            <StatusBadge status={p.status} />
          </Link>
        ))}
      </div>
    </>
  );
}
