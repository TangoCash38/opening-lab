import { createFileRoute } from "@tanstack/react-router";
import { CreatorPacksHelp } from "@/components/opening-lab/creator-packs-help";
import { CreatorPacksRoute } from "@/components/opening-lab/creator-packs-frame";

export const Route = createFileRoute("/creator-packs_/help")({
  component: CreatorPacksHelpRoute,
  head: () => ({
    meta: [
      { title: "Need help? · Opening Lab" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "A sample help note for creator packs. It opens an email and is not stored.",
      },
    ],
  }),
});

function CreatorPacksHelpRoute() {
  return (
    <CreatorPacksRoute current="help">
      <CreatorPacksHelp />
    </CreatorPacksRoute>
  );
}
