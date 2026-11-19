import { createFileRoute } from "@tanstack/react-router";
import { CreatorPacksAdmin } from "@/components/opening-lab/creator-packs-admin";
import { CreatorPacksRoute } from "@/components/opening-lab/creator-packs-frame";

export const Route = createFileRoute("/creator-packs_/admin")({
  component: CreatorPacksAdminRoute,
  head: () => ({
    meta: [
      { title: "Pack review · Opening Lab" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Sample pack review desk. Approve and send back stay on this device.",
      },
    ],
  }),
});

function CreatorPacksAdminRoute() {
  return (
    <CreatorPacksRoute current="admin">
      <CreatorPacksAdmin />
    </CreatorPacksRoute>
  );
}
