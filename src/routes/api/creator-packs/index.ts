import { createFileRoute } from "@tanstack/react-router";
import { creatorPackCatalogueResponse, createCreatorPackResponse } from "@/lib/creator-packs.server";

export const Route = createFileRoute("/api/creator-packs/")({
  server: {
    handlers: {
      GET: () => creatorPackCatalogueResponse(),
      POST: ({ request }) => createCreatorPackResponse(request),
    },
  },
});
