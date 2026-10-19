import { createFileRoute, redirect } from "@tanstack/react-router";
import { studioHead } from "@/lib/studio-head";

export const Route = createFileRoute("/")({
  head: () => studioHead("AzureBlaze Studio — Start writing", "Open the private AzureBlaze blog editor."),
  beforeLoad: () => {
    throw redirect({ to: "/admin/posts/new" });
  },
});
