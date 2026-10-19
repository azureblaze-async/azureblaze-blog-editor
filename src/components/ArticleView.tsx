import { toast } from "sonner";
import { Markdown } from "@/components/Markdown";
import { formatDate, mediaUrl, readingTime, type Post } from "@/lib/posts";

export function ArticleView({ post, preview = false }: { post: Pick<Post, "title" | "category" | "excerpt" | "content_markdown" | "cover_image_path" | "cover_image_alt" | "published_at">; preview?: boolean }) {
  const cover = mediaUrl(post.cover_image_path);
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };
  return (
    <article className="mx-auto max-w-[720px] px-5 py-14">
      <div className="mt-8 eyebrow">{post.category || "Uncategorized"}</div>
      <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.2rem)] font-bold leading-[1.08] tracking-[-0.03em] text-foreground">
        {post.title || "Untitled"}
      </h1>
      {post.excerpt && <p className="mt-5 font-serif text-xl italic leading-snug text-muted-foreground">{post.excerpt}</p>}
      <div className="mt-6 flex items-center justify-between border-y border-border py-3 text-[11px] text-faint">
        <span>{preview && !post.published_at ? "Not published" : formatDate(post.published_at)} · {readingTime(post.content_markdown)} min read</span>
        {!preview && <button onClick={share} className="text-primary hover:underline">Share</button>}
      </div>
      {cover && <img src={cover} alt={post.cover_image_alt ?? ""} className="mt-8 w-full rounded-lg border border-border" />}
      <div className="mt-10">
        <Markdown source={post.content_markdown ?? ""} />
      </div>
    </article>
  );
}
