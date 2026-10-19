import { createFileRoute } from "@tanstack/react-router";
import { PostEditor } from "@/components/PostEditor";
import { studioHead } from "@/lib/studio-head";

export const Route = createFileRoute("/admin/posts/new")({
  head: () => studioHead("New article — AzureBlaze Studio", "Write and preview a new AzureBlaze article."),
  component: () => <PostEditor post={null} />,
});
