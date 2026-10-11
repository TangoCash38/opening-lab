/**
 * Scotch-only Ask the coach. Other packs are rejected in the handler.
 * Vercel has no Stockfish binary: evals come from the cached JSON.
 */
import { createFileRoute } from "@tanstack/react-router";
import { askCoachPost } from "@/lib/ask-coach.server";

export const Route = createFileRoute("/api/ask-coach")({
  server: {
    handlers: {
      POST: askCoachPost,
    },
  },
});
