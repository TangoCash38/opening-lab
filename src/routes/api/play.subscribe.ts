import { createFileRoute } from "@tanstack/react-router";
import { playSubscribeResponse } from "@/lib/play-billing.server";

export const Route = createFileRoute("/api/play/subscribe")({
  server: {
    handlers: {
      POST: ({ request }) => playSubscribeResponse(request),
    },
  },
});
