import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader, StatusBadge, btn, fieldCls } from "@/components/admin-ui";
import { adminListPosts, deletePost, formatDate, publishPost, setStatus, type Post, type PostStatus } from "@/lib/posts";
import { studioHead } from "@/lib/studio-head";

export const Route = createFileRoute("/admin/posts/")({
  head: () => studioHead("Posts — AzureBlaze Studio", "Manage drafts, published posts and archived AzureBlaze articles."),
  component: PostsList,
});

const PAGE = 15;

function PostsList() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatusFilter] = useState<PostStatus | "all">("all");
  const [sort, setSort] = useState<"updated_at" | "published_at">("updated_at");
  const [page, setPage] = useState(0);
  const [toDelete, setToDelete] = useState<Post | null>(null);

  const q = useQuery({
    queryKey: ["admin", "posts", search, status, sort, page],
    queryFn: () => adminListPosts({ search, status, sort, page, pageSize: PAGE }),
    placeholderData: keepPreviousData,
  });

  const refresh = () => qc.invalidateQueries();
  const act = useMutation({
    mutationFn: async ({ p, action }: { p: Post; action: "publish" | "unpublish" | "archive" | "delete" }) => {
      if (action === "delete") return deletePost(p.id);
      if (action === "publish") return publishPost(p.id, p);
      return setStatus(p.id, action === "archive" ? "archived" : "draft");
    },
    onSuccess: (_d, v) => { toast.success(`Article ${v.action === "delete" ? "deleted" : v.action + "ed"}.`.replace("eed", "ed")); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = q.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <>
      <PageHeader eyebrow="Content" title="Posts" action={<Link to="/admin/posts/new" className={btn.primary}>New article</Link>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <input className={`${fieldCls} max-w-xs`} placeholder="Search title or slug…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        <select className={`${fieldCls} w-auto`} value={status} onChange={(e) => { setStatusFilter(e.target.value as PostStatus | "all"); setPage(0); }}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select className={`${fieldCls} w-auto`} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="updated_at">Sort: last updated</option>
          <option value="published_at">Sort: publish date</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-surface-2 text-[10px] uppercase tracking-[0.14em] text-faint">
            <tr>
              <th className="px-4 py-3 font-normal">Title</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Category</th>
              <th className="px-4 py-3 font-normal">Updated</th>
              <th className="px-4 py-3 font-normal">Published</th>
              <th className="px-4 py-3 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.posts.map((p) => (
              <tr key={p.id} className="border-t border-border bg-surface">
                <td className="px-4 py-3">
                  <Link to="/admin/posts/$id/edit" params={{ id: p.id }} className="text-sm text-foreground hover:text-primary">{p.title}</Link>
                  <div className="text-[11px] text-faint">/{p.slug}</div>
                </td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-muted-foreground">{p.category || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(p.updated_at)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(p.published_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3 text-[11px]">
                    <Link to="/admin/posts/$id/edit" params={{ id: p.id }} className="text-primary hover:underline">Edit</Link>
                    <Link to="/admin/posts/$id/edit" params={{ id: p.id }} search={{ preview: true }} className="text-muted-foreground hover:text-foreground">Preview</Link>
                    {p.status === "published" ? (
                      <button onClick={() => act.mutate({ p, action: "unpublish" })} className="text-muted-foreground hover:text-foreground">Unpublish</button>
                    ) : (
                      <button onClick={() => act.mutate({ p, action: "publish" })} className="text-success hover:underline">Publish</button>
                    )}
                    {p.status !== "archived" && (
                      <button onClick={() => act.mutate({ p, action: "archive" })} className="text-muted-foreground hover:text-foreground">Archive</button>
                    )}
                    <button onClick={() => setToDelete(p)} className="text-destructive hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {q.data && q.data.posts.length === 0 && (
          <div className="bg-surface p-12 text-center text-sm text-muted-foreground">
            {search || status !== "all" ? "No articles match these filters." : <Link to="/admin/posts/new" className={btn.primary}>Create your first article</Link>}
          </div>
        )}
        {q.error && <div className="p-6 text-sm text-destructive">{(q.error as Error).message}</div>}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{total} article{total === 1 ? "" : "s"}</span>
        <div className="flex items-center gap-2">
          <button className={btn.ghost} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>{page + 1} / {pages}</span>
          <button className={btn.ghost} disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{toDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the article. Uploaded images are kept in your media storage.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (toDelete) act.mutate({ p: toDelete, action: "delete" }); setToDelete(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
