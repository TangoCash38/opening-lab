import { createFileRoute } from "@tanstack/react-router";
import { creatorPacksMineResponse } from "@/lib/creator-packs.server";

export const Route = createFileRoute("/api/creator-packs/mine")({
  server: {
    handlers: {
      GET: ({ request }) => creatorPacksMineResponse(request),
    },
  },
});
