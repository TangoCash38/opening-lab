/**
 * Vercel has no Stockfish binary. Unset STOCKFISH_PATH → fail-soft.
 * Live eval later via a worker with STOCKFISH_PATH — no WASM here.
 */
import { createFileRoute } from "@tanstack/react-router";
import { practiceReviewEvalPost } from "@/lib/practice-review-eval.server";

export const Route = createFileRoute("/api/practice-review-eval")({
  server: {
    handlers: {
      POST: practiceReviewEvalPost,
    },
  },
});
