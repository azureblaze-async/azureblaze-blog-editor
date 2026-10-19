import { MEDIA_BUCKET, requireSupabase, supabase } from "./supabase";
import { completeImageUpload, prepareImageUpload } from "./media.functions";
import { validateImage } from "./media";
export { MAX_UPLOAD_MB } from "./media";

export type PostStatus = "draft" | "published" | "archived";

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_markdown: string | null;
  category: string | null;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  status: PostStatus;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  social_image_path: string | null;
  created_at: string;
  updated_at: string;
}

export type PostInput = Omit<Post, "id" | "created_at" | "updated_at" | "published_at" | "status">;

export const emptyPost: PostInput = {
  title: "",
  slug: "",
  excerpt: "",
  content_markdown: "",
  category: "",
  cover_image_path: null,
  cover_image_alt: "",
  seo_title: "",
  seo_description: "",
  social_image_path: null,
};

/* ---------- pure helpers ---------- */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function readingTime(markdown: string | null | undefined): number {
  const words = (markdown ?? "").replace(/[#>*_`\-[\]()!]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** Returns a list of problems that block publication. Empty = OK. */
export function validateForPublish(p: PostInput): string[] {
  const errs: string[] = [];
  if (!p.title.trim()) errs.push("Title is required.");
  if (!slugify(p.slug)) errs.push("Slug is required (letters, numbers, hyphens).");
  if (!p.excerpt?.trim()) errs.push("Excerpt is required to publish.");
  if (!p.content_markdown?.trim()) errs.push("Content is required to publish.");
  if (!p.category?.trim()) errs.push("Category is required to publish.");
  if (p.cover_image_path && !p.cover_image_alt?.trim()) errs.push("Cover image needs alt text.");
  return errs;
}

export function validateForDraft(p: PostInput): string[] {
  const errs: string[] = [];
  if (!p.title.trim()) errs.push("Title is required.");
  if (!slugify(p.slug)) errs.push("Slug is required (letters, numbers, hyphens).");
  return errs;
}

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (!supabase) return null;
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

function friendly(error: { code?: string; message: string }): Error {
  if (error.code === "23505") return new Error("That slug is already used by another article.");
  if (error.code === "42501") return new Error("You are not authorized to do that.");
  return new Error(error.message);
}

/* ---------- public queries ---------- */

const PUBLIC_COLS =
  "id,title,slug,excerpt,category,cover_image_path,cover_image_alt,published_at,content_markdown,seo_title,seo_description,social_image_path,status,created_at,updated_at";

export async function listPublishedPosts(): Promise<Post[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("posts")
    .select(PUBLIC_COLS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);
  if (error) throw friendly(error);
  return (data ?? []) as Post[];
}

export async function getPublishedPost(slug: string): Promise<Post | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("posts")
    .select(PUBLIC_COLS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw friendly(error);
  return (data as Post) ?? null;
}

/* ---------- admin queries ---------- */

export async function isCurrentUserAdmin(): Promise<boolean> {
  const sb = requireSupabase();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return false;
  const { data, error } = await sb.rpc("is_admin");
  if (error) return false;
  return data === true;
}

export interface AdminListParams {
  search?: string;
  status?: PostStatus | "all";
  sort?: "updated_at" | "published_at";
  page?: number;
  pageSize?: number;
}

export async function adminListPosts(p: AdminListParams = {}) {
  const sb = requireSupabase();
  const page = p.page ?? 0;
  const size = p.pageSize ?? 15;
  let q = sb.from("posts").select("*", { count: "exact" });
  if (p.status && p.status !== "all") q = q.eq("status", p.status);
  if (p.search?.trim()) {
    const s = p.search.trim().replace(/[%,()]/g, "");
    q = q.or(`title.ilike.%${s}%,slug.ilike.%${s}%`);
  }
  q = q.order(p.sort ?? "updated_at", { ascending: false, nullsFirst: false }).range(page * size, page * size + size - 1);
  const { data, error, count } = await q;
  if (error) throw friendly(error);
  return { posts: (data ?? []) as Post[], total: count ?? 0 };
}

export async function adminCounts() {
  const sb = requireSupabase();
  const c = async (s: PostStatus) => {
    const { count, error } = await sb.from("posts").select("id", { count: "exact", head: true }).eq("status", s);
    if (error) throw friendly(error);
    return count ?? 0;
  };
  const [published, draft, archived] = await Promise.all([c("published"), c("draft"), c("archived")]);
  return { published, draft, archived };
}

export async function adminGetPost(id: string): Promise<Post | null> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("posts").select("*").eq("id", id).maybeSingle();
  if (error) throw friendly(error);
  return (data as Post) ?? null;
}

/* ---------- mutations ---------- */

function clean(p: PostInput) {
  const n = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);
  return {
    title: p.title.trim(),
    slug: slugify(p.slug),
    excerpt: n(p.excerpt),
    content_markdown: p.content_markdown ?? "",
    category: n(p.category),
    cover_image_path: p.cover_image_path,
    cover_image_alt: n(p.cover_image_alt),
    seo_title: n(p.seo_title),
    seo_description: n(p.seo_description),
    social_image_path: p.social_image_path,
  };
}

/** Save content, keep current status. Creates when id is null. */
export async function savePost(id: string | null, input: PostInput): Promise<Post> {
  const sb = requireSupabase();
  const errs = validateForDraft(input);
  if (errs.length) throw new Error(errs.join(" "));
  const row = clean(input);
  const res = id
    ? await sb.from("posts").update(row).eq("id", id).select("*").single()
    : await sb.from("posts").insert({ ...row, status: "draft" }).select("*").single();
  if (res.error) throw friendly(res.error);
  return res.data as Post;
}

export async function setStatus(id: string, status: PostStatus): Promise<Post> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("posts").update({ status }).eq("id", id).select("*").single();
  if (error) throw friendly(error);
  return data as Post;
}

export async function publishPost(id: string | null, input: PostInput): Promise<Post> {
  const errs = validateForPublish(input);
  if (errs.length) throw new Error(errs.join(" "));
  const saved = await savePost(id, input);
  // published_at is assigned once by a DB trigger on first publication.
  return setStatus(saved.id, "published");
}

export async function deletePost(id: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("posts").delete().eq("id", id);
  if (error) throw friendly(error);
}

export async function uploadImage(file: File, folder: "covers" | "inline"): Promise<string> {
  validateImage(file.type, file.size);
  const { key, uploadUrl } = await prepareImageUpload({ data: { type: file.type, size: file.size, folder } });
  const response = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`R2 upload failed (${response.status}): ${detail}. Check bucket credentials and CORS settings.`);
  }
  const { publicUrl } = await completeImageUpload({ data: { key, type: file.type, size: file.size } });
  return publicUrl;
}
