import { createFileRoute } from "@tanstack/react-router";
import { CreatorPacksBecome } from "@/components/opening-lab/creator-packs-become";
import { CreatorPacksRoute } from "@/components/opening-lab/creator-packs-frame";

export const Route = createFileRoute("/creator-packs_/become")({
  component: CreatorPacksBecomeRoute,
  head: () => ({
    meta: [
      { title: "Become a creator · Opening Lab" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Sample preview of the Opening Lab creator programme. The application form is not sent.",
      },
    ],
  }),
});

function CreatorPacksBecomeRoute() {
  return (
    <CreatorPacksRoute current="become">
      <CreatorPacksBecome />
    </CreatorPacksRoute>
  );
}
