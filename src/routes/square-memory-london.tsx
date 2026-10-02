import { useLayoutEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { isPlayApp, readSquareMemoryPlayPreview } from "@/lib/play-app";

export const Route = createFileRoute("/square-memory-london")({
  component: SquareMemoryLondonRedirect,
  head: () => ({
    meta: [
      { title: "Square Memory · Opening Lab" },
      {
        name: "description",
        content: "Watch the squares. Tap them back in order.",
      },
    ],
  }),
});

function SquareMemoryLondonRedirect() {
  useLayoutEffect(() => {
    window.location.replace(
      isPlayApp() && !readSquareMemoryPlayPreview() ? "/" : "/square-memory",
    );
  }, []);
  return null;
}
