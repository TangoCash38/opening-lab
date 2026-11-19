import { createFileRoute } from "@tanstack/react-router";
import { CreatorPacksRoute } from "@/components/opening-lab/creator-packs-frame";
import { CreatorRatingsIndex } from "@/components/opening-lab/creator-packs-ratings";

export const Route = createFileRoute("/creator-packs_/ratings")({
  component: CreatorRatingsIndexRoute,
  head: () => ({
    meta: [
      { title: "Creator ratings · Opening Lab" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Sample ratings for fictional creators. Nothing is stored.",
      },
    ],
  }),
});

function CreatorRatingsIndexRoute() {
  return (
    <CreatorPacksRoute current="ratings">
      <CreatorRatingsIndex />
    </CreatorPacksRoute>
  );
}
