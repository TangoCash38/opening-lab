import { createFileRoute } from "@tanstack/react-router";
import { CreatorPacksBrowse } from "@/components/opening-lab/creator-packs-browse";
import { CreatorPacksRoute } from "@/components/opening-lab/creator-packs-frame";

export const Route = createFileRoute("/creator-packs")({
  component: CreatorPacksBrowseRoute,
  head: () => ({
    meta: [
      { title: "Creator packs · Opening Lab" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Sample preview of creator packs. Fictional coaches and packs. Not for sale.",
      },
    ],
  }),
});

function CreatorPacksBrowseRoute() {
  return (
    <CreatorPacksRoute current="browse">
      <CreatorPacksBrowse />
    </CreatorPacksRoute>
  );
}
