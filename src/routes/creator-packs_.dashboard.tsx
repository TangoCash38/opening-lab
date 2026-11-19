import { createFileRoute } from "@tanstack/react-router";
import { CreatorPacksDashboard } from "@/components/opening-lab/creator-packs-dashboard";
import { CreatorPacksRoute } from "@/components/opening-lab/creator-packs-frame";

export const Route = createFileRoute("/creator-packs_/dashboard")({
  component: CreatorPacksDashboardRoute,
  head: () => ({
    meta: [
      { title: "Your packs · Opening Lab" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Sample creator dashboard. In review and live badges stay on this device.",
      },
    ],
  }),
});

function CreatorPacksDashboardRoute() {
  return (
    <CreatorPacksRoute current="dashboard">
      <CreatorPacksDashboard />
    </CreatorPacksRoute>
  );
}
