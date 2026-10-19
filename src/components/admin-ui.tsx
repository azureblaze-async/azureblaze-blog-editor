import type { ReactNode } from "react";
import type { PostStatus } from "@/lib/posts";

export function PageHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      {action}
    </div>
  );
}

const statusStyle: Record<PostStatus, string> = {
  published: "border-success/30 bg-success/10 text-success",
  draft: "border-warning/30 bg-warning/10 text-warning",
  archived: "border-border-strong bg-surface-3 text-muted-foreground",
};

export function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${statusStyle[status]}`}>
      {status}
    </span>
  );
}

export const btn = {
  primary: "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50",
  ghost: "inline-flex items-center gap-2 rounded-md border border-border-strong px-3 py-2 text-xs text-foreground transition-colors hover:border-azure-border hover:bg-azure-dim disabled:opacity-50",
  danger: "inline-flex items-center gap-2 rounded-md border border-destructive/40 px-3 py-2 text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50",
};

export const fieldCls =
  "w-full rounded-md border border-input bg-surface-2 px-3 py-2 text-sm text-foreground outline-none placeholder:text-faint focus:border-azure-border";
export const labelCls = "mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-muted-foreground";
