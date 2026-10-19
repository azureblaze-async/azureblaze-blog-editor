import { createFileRoute, notFound } from "@tanstack/react-router";
import { PostEditor } from "@/components/PostEditor";
import { adminGetPost } from "@/lib/posts";

export const Route = createFileRoute("/admin/posts/$id/edit")({
  validateSearch: (s: Record<string, unknown>): { preview?: boolean } => (s["preview"] === true || s["preview"] === "true" ? { preview: true } : {}),
  loader: async ({ params }) => {
    const post = await adminGetPost(params.id);
    if (!post) throw notFound();
    return { post };
  },
  component: EditPage,
});

function EditPage() {
  const { post } = Route.useLoaderData();
  const { preview } = Route.useSearch();
  return <PostEditor key={post.id} post={post} initialPreview={!!preview} />;
}
