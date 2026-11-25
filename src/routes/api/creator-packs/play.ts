import { createFileRoute } from "@tanstack/react-router";
import { confirmCreatorPlayResponse } from "@/lib/creator-packs.server";

export const Route = createFileRoute("/api/creator-packs/play")({
  server: {
    handlers: {
      POST: ({ request }) => confirmCreatorPlayResponse(request),
    },
  },
});
