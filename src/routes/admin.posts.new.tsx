import { createFileRoute } from "@tanstack/react-router";
import { PostEditor } from "@/components/PostEditor";

export const Route = createFileRoute("/admin/posts/new")({
  component: () => <PostEditor post={null} />,
});
