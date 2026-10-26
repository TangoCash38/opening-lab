import { useLayoutEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SquareMemory } from "@/components/opening-lab/square-memory";
import { SquareMemoryLevels } from "@/components/opening-lab/square-memory-levels";
import { initBoardTheme } from "@/lib/board-theme";
import { initColorScheme } from "@/lib/color-scheme";
import { I18nProvider } from "@/lib/i18n";

export const Route = createFileRoute("/square-memory")({
  component: SquareMemoryRoute,
  head: () => ({
    meta: [
      { title: "Square Memory · Opening Lab" },
      {
        name: "description",
        content: "A position flashes up. Put the pieces back.",
      },
    ],
  }),
});

function SquareMemoryRoute() {
  const [ready, setReady] = useState(false);
  const [lines, setLines] = useState(false);
  useLayoutEffect(() => {
    const stopBoard = initBoardTheme();
    const stopColor = initColorScheme();
    setReady(true);
    return () => {
      stopBoard();
      stopColor();
    };
  }, []);
  if (!ready) return null;
  return (
    <I18nProvider>
      <div data-surface="website" data-square-memory-page>
        {lines ? (
          <div className="sml-lines">
            <button type="button" className="sml-lines-back" data-sml-levels onClick={() => setLines(false)}>
              Levels
            </button>
            <div className="sml-lines-game">
              <SquareMemory />
            </div>
          </div>
        ) : (
          <SquareMemoryLevels onOpenLines={() => setLines(true)} />
        )}
      </div>
    </I18nProvider>
  );
}
