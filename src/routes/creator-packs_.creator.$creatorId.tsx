import { createFileRoute } from "@tanstack/react-router";
import { CreatorPacksRoute } from "@/components/opening-lab/creator-packs-frame";
import { CreatorRatingsProfile } from "@/components/opening-lab/creator-packs-ratings";

export const Route = createFileRoute("/creator-packs_/creator/$creatorId")({
  component: CreatorRatingsProfileRoute,
  head: () => ({
    meta: [
      { title: "Creator ratings · Opening Lab" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Sample creator ratings and fictional reviews. Nothing is stored.",
      },
    ],
  }),
});

function CreatorRatingsProfileRoute() {
  const { creatorId } = Route.useParams();
  return (
    <CreatorPacksRoute current="ratings">
      <CreatorRatingsProfile creatorId={creatorId} />
    </CreatorPacksRoute>
  );
}
