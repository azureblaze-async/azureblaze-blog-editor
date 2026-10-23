import { useState } from "react";
import { fieldCls, labelCls } from "@/components/admin-ui";
import type { PostInput } from "@/lib/posts";

export function PostMetadataFields({ form, set }: {
  form: PostInput;
  set: <K extends keyof PostInput>(key: K, value: PostInput[K]) => void;
}) {
  const [tagsText, setTagsText] = useState(() => (form.tags ?? []).join(", "));
  return (
    <details open className="rounded-lg border border-border bg-surface p-4">
      <summary className={`${labelCls} mb-0 cursor-pointer`}>SEO & social</summary>
      <div className="mt-3 space-y-4">
        <fieldset className="space-y-3">
          <legend className="mb-2 text-xs font-medium text-foreground">Search metadata</legend>
          <div>
            <label htmlFor="meta-title" className={labelCls}>Meta title</label>
            <input id="meta-title" className={fieldCls} placeholder={form.title} value={form.seo_title ?? ""} onChange={(e) => set("seo_title", e.target.value)} />
          </div>
          <div>
            <label htmlFor="meta-description" className={labelCls}>Meta description</label>
            <textarea id="meta-description" className={`${fieldCls} min-h-[100px] resize-y`} placeholder={form.excerpt ?? ""} value={form.seo_description ?? ""} onChange={(e) => set("seo_description", e.target.value)} />
          </div>
        </fieldset>
        <fieldset className="space-y-3 border-t border-border pt-3">
          <legend className="text-xs font-medium text-foreground">Social sharing</legend>
          <div>
            <label htmlFor="og-title" className={labelCls}>OG title</label>
            <input id="og-title" className={fieldCls} placeholder={form.seo_title || form.title} value={form.og_title ?? ""} onChange={(e) => set("og_title", e.target.value)} />
          </div>
          <div>
            <label htmlFor="og-description" className={labelCls}>OG description</label>
            <textarea id="og-description" className={`${fieldCls} min-h-[100px] resize-y`} placeholder={form.seo_description || form.excerpt || ""} value={form.og_description ?? ""} onChange={(e) => set("og_description", e.target.value)} />
          </div>
        </fieldset>
        <div className="border-t border-border pt-3">
          <label htmlFor="article-tags" className={labelCls}>Keywords / tags</label>
          <textarea id="article-tags" className={`${fieldCls} min-h-[80px] resize-y`} placeholder="Android, iOS, mobile operating systems" value={tagsText} onChange={(e) => {
            setTagsText(e.target.value);
            set("tags", e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean));
          }} />
        </div>
      </div>
    </details>
  );
}