import { createFileRoute } from "@tanstack/react-router";
import { CreatorPacksPack } from "@/components/opening-lab/creator-packs-pack";
import { CreatorPacksRoute } from "@/components/opening-lab/creator-packs-frame";

export const Route = createFileRoute("/creator-packs_/pack/$packId")({
  component: CreatorPacksPackRoute,
  head: () => ({
    meta: [
      { title: "Creator pack · Opening Lab" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Sample creator pack. Line 1 is shown. Lines 2 to 10 are locked. Buying is preview only.",
      },
    ],
  }),
});

function CreatorPacksPackRoute() {
  const { packId } = Route.useParams();
  return (
    <CreatorPacksRoute current="pack">
      <CreatorPacksPack packId={packId} />
    </CreatorPacksRoute>
  );
}
