import { createFileRoute } from "@tanstack/react-router";
import { CreatorPacksAgreement } from "@/components/opening-lab/creator-packs-agreement";
import { CreatorPacksRoute } from "@/components/opening-lab/creator-packs-frame";

export const Route = createFileRoute("/creator-packs_/agreement")({
  component: CreatorPacksAgreementRoute,
  head: () => ({
    meta: [
      { title: "Creator agreement · Opening Lab" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Creator agreement for Opening Lab packs. Private until the programme opens.",
      },
    ],
  }),
});

function CreatorPacksAgreementRoute() {
  return (
    <CreatorPacksRoute current="agreement">
      <CreatorPacksAgreement />
    </CreatorPacksRoute>
  );
}
