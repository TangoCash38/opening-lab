import { useLayoutEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LondonMemory } from "@/components/opening-lab/square-memory-london";
import { initBoardTheme } from "@/lib/board-theme";
import { initColorScheme } from "@/lib/color-scheme";
import { I18nProvider } from "@/lib/i18n";
import { isPlayApp } from "@/lib/play-app";

export const Route = createFileRoute("/square-memory-london")({
  component: LondonMemoryRoute,
  head: () => ({
    meta: [
      { title: "London Memory · Opening Lab" },
      {
        name: "description",
        content: "Watch the squares. Tap them back in order.",
      },
    ],
  }),
});

function LondonMemoryRoute() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useLayoutEffect(() => {
    const stopBoard = initBoardTheme();
    const stopColor = initColorScheme();
    if (isPlayApp()) {
      setAllowed(false);
      window.location.replace("/");
    } else {
      setAllowed(true);
    }
    return () => {
      stopBoard();
      stopColor();
    };
  }, []);
  if (allowed !== true) return null;
  return (
    <I18nProvider>
      <div data-surface="website" data-london-memory-page>
        <LondonMemory />
      </div>
    </I18nProvider>
  );
}
