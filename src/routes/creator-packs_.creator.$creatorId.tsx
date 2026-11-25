import { createFileRoute } from "@tanstack/react-router";
import { CreatorPublicProfile } from "@/components/opening-lab/creator-packs-creator";
import { CreatorPacksRoute } from "@/components/opening-lab/creator-packs-frame";

export const Route = createFileRoute("/creator-packs_/creator/$creatorId")({
  component: CreatorRatingsProfileRoute,
  head: () => ({
    meta: [
      { title: "Creator · Opening Lab" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Live packs from this creator. The page stays private until Opening Lab opens it.",
      },
    ],
  }),
});

function CreatorRatingsProfileRoute() {
  const { creatorId } = Route.useParams();
  return (
    <CreatorPacksRoute current="ratings">
      <CreatorPublicProfile creatorId={creatorId} />
    </CreatorPacksRoute>
  );
}
