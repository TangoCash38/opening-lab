import { createFileRoute } from "@tanstack/react-router";
import { CreatorPacksEditor } from "@/components/opening-lab/creator-packs-editor";
import { CreatorPacksRoute } from "@/components/opening-lab/creator-packs-frame";

export const Route = createFileRoute("/creator-packs_/editor")({
  component: CreatorPacksEditorRoute,
  head: () => ({
    meta: [
      { title: "Pack editor · Opening Lab" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Sample pack editor. Move comments, Drill or Walk-through, and publish stay on this page. Nothing is stored.",
      },
    ],
  }),
});

function CreatorPacksEditorRoute() {
  return (
    <CreatorPacksRoute current="editor">
      <CreatorPacksEditor />
    </CreatorPacksRoute>
  );
}
