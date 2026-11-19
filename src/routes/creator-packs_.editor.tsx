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
        content: "Sample pack editor. Lines are not saved. Stockfish and Line Gate checks are described, not run.",
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
