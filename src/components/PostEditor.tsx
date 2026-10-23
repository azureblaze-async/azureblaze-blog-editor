import { useNavigate, useBlocker } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bold, Code, Heading2, Heading3, ImageIcon, Italic, Link2, List, ListOrdered, Minus, Quote,
} from "lucide-react";
import { ArticleView } from "@/components/ArticleView";
import { PostMetadataFields } from "@/components/PostMetadataFields";
import { PageHeader, StatusBadge, btn, fieldCls, labelCls } from "@/components/admin-ui";
import {
  emptyPost, mediaUrl, publishPost, savePost, setStatus, slugify, uploadImage, validateForPublish,
  type Post, type PostInput,
} from "@/lib/posts";

function toInput(p: Post | null): PostInput {
  if (!p) return { ...emptyPost };
  const { id: _i, created_at: _c, updated_at: _u, published_at: _p, status: _s, ...rest } = p;
  return { ...emptyPost, ...rest, excerpt: rest.excerpt ?? "", category: rest.category ?? "", cover_image_alt: rest.cover_image_alt ?? "", seo_title: rest.seo_title ?? "", seo_description: rest.seo_description ?? "" };
}

export function PostEditor({ post, initialPreview = false }: { post: Post | null; initialPreview?: boolean }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [current, setCurrent] = useState<Post | null>(post);
  const [form, setForm] = useState<PostInput>(() => toInput(post));
  const [saved, setSaved] = useState<string>(() => JSON.stringify(toInput(post)));
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [mode, setMode] = useState<"write" | "split" | "preview">(initialPreview ? "preview" : "split");
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const ta = useRef<HTMLTextAreaElement>(null);
  const inlineFile = useRef<HTMLInputElement>(null);
  const coverFile = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(form) !== saved;
  useBlocker({ shouldBlockFn: () => dirty && !window.confirm("You have unsaved changes. Leave anyway?"), enableBeforeUnload: () => dirty });

  const set = <K extends keyof PostInput>(k: K, v: PostInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const onTitle = (v: string) => setForm((f) => ({ ...f, title: v, slug: slugTouched ? f.slug : slugify(v) }));

  const after = (p: Post, msg: string) => {
    setCurrent(p);
    const next = toInput(p);
    setForm(next);
    setSaved(JSON.stringify(next));
    setErrors([]);
    qc.invalidateQueries();
    toast.success(msg);
    if (!post) setTimeout(() => navigate({ to: "/admin/posts/$id/edit", params: { id: p.id }, replace: true }), 0);
  };

  const run = async (label: string, fn: () => Promise<Post>, msg: string) => {
    if (busy) return;
    setBusy(label);
    try { after(await fn(), msg); }
    catch (e) { const m = (e as Error).message; setErrors([m]); toast.error(m); }
    finally { setBusy(null); }
  };

  const onSave = () => run("save", () => savePost(current?.id ?? null, form), current?.status === "published" ? "Changes published." : "Draft saved.");
  const onPublish = () => {
    const errs = validateForPublish(form);
    if (errs.length) { setErrors(errs); toast.error("Fix the highlighted issues before publishing."); return; }
    run("publish", () => publishPost(current?.id ?? null, form), "Article published.");
  };
  const onUnpublish = () => current && run("unpublish", async () => { await savePost(current.id, form); return setStatus(current.id, "draft"); }, "Moved back to drafts.");
  const onArchive = () => current && run("archive", async () => { await savePost(current.id, form); return setStatus(current.id, "archived"); }, "Article archived.");

  // Ctrl/Cmd+S to save
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); onSave(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  /* ---- toolbar ---- */
  const wrap = (before: string, after = before, placeholder = "text") => {
    const el = ta.current; if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const sel = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    set("content_markdown", next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + sel.length); });
  };
  const linePrefix = (prefix: string | ((i: number) => string)) => {
    const el = ta.current; if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const start = value.lastIndexOf("\n", s - 1) + 1;
    const block = value.slice(start, e) || "item";
    const out = block.split("\n").map((l, i) => (typeof prefix === "function" ? prefix(i) : prefix) + l).join("\n");
    set("content_markdown", value.slice(0, start) + out + value.slice(e));
    requestAnimationFrame(() => el.focus());
  };
  const insertBlock = (text: string) => {
    const el = ta.current; if (!el) return;
    const { selectionStart: s, value } = el;
    const pre = s > 0 && value[s - 1] !== "\n" ? "\n\n" : "";
    set("content_markdown", value.slice(0, s) + pre + text + "\n" + value.slice(s));
    requestAnimationFrame(() => el.focus());
  };
  const onLink = () => { const url = window.prompt("Link URL", "https://"); if (url) wrap("[", `](${url})`, "link text"); };
  const onInlineImage = async (f?: File) => {
    if (!f) return;
    const alt = window.prompt("Describe the image (alt text)", "") ?? "";
    setBusy("upload");
    try { const path = await uploadImage(f, "inline"); insertBlock(`![${alt}](${mediaUrl(path)})`); toast.success("Image inserted."); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); if (inlineFile.current) inlineFile.current.value = ""; }
  };
  const onCover = async (f?: File) => {
    if (!f) return;
    setBusy("cover");
    try { const path = await uploadImage(f, "covers"); set("cover_image_path", path); toast.success("Cover uploaded."); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); if (coverFile.current) coverFile.current.value = ""; }
  };

  const tools = [
    { icon: Bold, label: "Bold", fn: () => wrap("**") },
    { icon: Italic, label: "Italic", fn: () => wrap("*") },
    { icon: Heading2, label: "Heading 2", fn: () => linePrefix("## ") },
    { icon: Heading3, label: "Heading 3", fn: () => linePrefix("### ") },
    { icon: List, label: "Bulleted list", fn: () => linePrefix("- ") },
    { icon: ListOrdered, label: "Numbered list", fn: () => linePrefix((i) => `${i + 1}. `) },
    { icon: Quote, label: "Quote", fn: () => linePrefix("> ") },
    { icon: Link2, label: "Link", fn: onLink },
    { icon: ImageIcon, label: "Image", fn: () => inlineFile.current?.click() },
    { icon: Code, label: "Code block", fn: () => wrap("\n```\n", "\n```\n", "code") },
    { icon: Minus, label: "Divider", fn: () => insertBlock("\n---\n") },
  ];

  const status = current?.status ?? "draft";
  const cover = mediaUrl(form.cover_image_path);
  const words = (form.content_markdown ?? "").split(/\s+/).filter(Boolean).length;

  return (
    <>
      <PageHeader
        eyebrow={post ? "Edit article" : "New article"}
        title={form.title || "Untitled article"}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
            <span className="text-[11px] text-faint">{dirty ? "● Unsaved changes" : "All changes saved"}</span>
          </div>
        }
      />

      {errors.length > 0 && (
        <div role="alert" className="mb-5 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
          <ul className="list-disc pl-4">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <input
            className="w-full bg-transparent font-display text-3xl font-bold tracking-tight text-foreground outline-none placeholder:text-faint"
            placeholder="Article title"
            value={form.title}
            onChange={(e) => onTitle(e.target.value)}
            aria-label="Title"
          />
          <textarea
            className={`${fieldCls} min-h-[70px] resize-y font-serif text-lg italic`}
            placeholder="A short excerpt shown on cards and social previews…"
            value={form.excerpt ?? ""}
            onChange={(e) => set("excerpt", e.target.value)}
            aria-label="Excerpt"
          />

          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-2 px-2 py-1.5">
              <div className="flex flex-wrap">
                {tools.map((t) => (
                  <button key={t.label} type="button" title={t.label} aria-label={t.label} onClick={t.fn} disabled={mode === "preview"}
                    className="rounded p-2 text-muted-foreground transition-colors hover:bg-surface-3 hover:text-primary disabled:opacity-30">
                    <t.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
              <div className="flex rounded-md border border-border-strong p-0.5 text-[10px] uppercase tracking-[0.12em]">
                {(["write", "split", "preview"] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={`rounded px-2.5 py-1 ${mode === m ? "bg-azure-dim text-primary" : "text-muted-foreground"}`}>{m}</button>
                ))}
              </div>
            </div>
            <div className={mode === "split" ? "grid md:grid-cols-2" : ""}>
              {mode !== "preview" && (
                <textarea
                  ref={ta}
                  value={form.content_markdown ?? ""}
                  onChange={(e) => set("content_markdown", e.target.value)}
                  placeholder={"Start writing…\n\n## A heading\n\nMarkdown is supported."}
                  className="min-h-[560px] w-full resize-y bg-transparent p-5 text-[14px] leading-[1.75] text-foreground outline-none placeholder:text-faint"
                  aria-label="Article content"
                />
              )}
              {mode !== "write" && (
                <div className={`max-h-[80vh] overflow-y-auto ${mode === "split" ? "border-t border-border md:border-l md:border-t-0" : ""}`}>
                  <ArticleView preview post={{ ...form, published_at: current?.published_at ?? null }} />
                </div>
              )}
            </div>
            <div className="border-t border-border px-4 py-2 text-[10px] text-faint">{words} words · ⌘/Ctrl+S to save</div>
          </div>
          <input ref={inlineFile} type="file" accept="image/*" className="hidden" onChange={(e) => onInlineImage(e.target.files?.[0])} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
            <div className={labelCls}>Publishing</div>
            <button className={`${btn.ghost} w-full justify-center`} onClick={onSave} disabled={!!busy}>{busy === "save" ? "Saving…" : status === "published" ? "Save changes" : "Save draft"}</button>
            {status !== "published" ? (
              <button className={`${btn.primary} w-full justify-center`} onClick={onPublish} disabled={!!busy}>{busy === "publish" ? "Publishing…" : "Publish"}</button>
            ) : (
              <button className={`${btn.ghost} w-full justify-center`} onClick={onUnpublish} disabled={!!busy}>Unpublish</button>
            )}
            {current && status !== "archived" && (
              <button className="w-full py-1 text-[11px] text-muted-foreground hover:text-foreground" onClick={onArchive} disabled={!!busy}>Archive</button>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
            <div>
              <label className={labelCls}>Slug</label>
              <input className={fieldCls} value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-")); }} />
              {status === "published" && <p className="mt-1 text-[10px] text-warning">Changing a live slug breaks existing links.</p>}
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <input className={fieldCls} placeholder="e.g. Systems" value={form.category ?? ""} onChange={(e) => set("category", e.target.value)} />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
            <div className={labelCls}>Cover image</div>
            {cover ? (
              <div className="space-y-2">
                <img src={cover} alt="" className="aspect-video w-full rounded-md border border-border object-cover" />
                <button className="text-[11px] text-destructive hover:underline" onClick={() => set("cover_image_path", null)}>Remove cover</button>
              </div>
            ) : (
              <button className={`${btn.ghost} w-full justify-center`} onClick={() => coverFile.current?.click()} disabled={!!busy}>{busy === "cover" ? "Uploading…" : "Upload cover"}</button>
            )}
            <input ref={coverFile} type="file" accept="image/*" className="hidden" onChange={(e) => onCover(e.target.files?.[0])} />
            <div>
              <label htmlFor="cover-alt" className={labelCls}>Cover alt text</label>
              <textarea id="cover-alt" className={`${fieldCls} min-h-[100px] resize-y`} value={form.cover_image_alt ?? ""} onChange={(e) => set("cover_image_alt", e.target.value)} />
            </div>
          </div>

          <PostMetadataFields form={form} set={set} />
        </aside>
      </div>
    </>
  );
}
