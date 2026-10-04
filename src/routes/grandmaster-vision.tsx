import { useLayoutEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GrandmasterVision } from "@/components/opening-lab/grandmaster-vision";
import { initColorScheme } from "@/lib/color-scheme";
import { I18nProvider } from "@/lib/i18n";

export const Route = createFileRoute("/grandmaster-vision")({
  component: GrandmasterVisionRoute,
  head: () => ({
    meta: [
      { title: "Grandmaster Vision · Opening Lab" },
      {
        name: "description",
        content: "Study a chess position at your own pace, then rebuild it from the tray.",
      },
    ],
  }),
});

function GrandmasterVisionRoute() {
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const stopColor = initColorScheme();
    setReady(true);
    return () => stopColor();
  }, []);
  if (!ready) return null;
  return (
    <I18nProvider>
      <div data-surface="website" data-grandmaster-vision-page>
        <GrandmasterVision />
      </div>
    </I18nProvider>
  );
}
