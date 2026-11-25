import { createFileRoute } from "@tanstack/react-router";
import { creatorPackDetailResponse } from "@/lib/creator-packs.server";

export const Route = createFileRoute("/api/creator-packs/pack/$packId")({
  server: {
    handlers: {
      GET: ({ request, params }) => creatorPackDetailResponse(request, params.packId),
    },
  },
});
