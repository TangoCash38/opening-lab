import { createFileRoute } from "@tanstack/react-router";
import { creatorPublicProfileResponse } from "@/lib/creator-packs.server";

export const Route = createFileRoute("/api/creator-packs/creator/$creatorId")({
  server: {
    handlers: {
      GET: ({ params }) => creatorPublicProfileResponse(params.creatorId),
    },
  },
});
