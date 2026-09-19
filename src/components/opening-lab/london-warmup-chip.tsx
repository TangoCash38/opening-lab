import { useMemo } from "react";
import type { OpeningLine, Pack } from "@/data/packs";
import { useProgress } from "@/hooks/use-progress";
import { useT } from "@/lib/i18n";
import {
  LONDON_PACK_ID,
  pickLondonWarmup,
  type TrainStartOptions,
} from "@/lib/london-warmup";

type TrainMode = "learn" | "practice";

type Props = {
  pack: Pack;
  onStartLine: (
    pack: Pack,
    line: OpeningLine,
    mode?: TrainMode,
    options?: TrainStartOptions,
  ) => void;
};

/** Quiet chip on the Fight the London card — Practice, 3 book plies. */
export function LondonWarmupChip({ pack, onStartLine }: Props) {
  const t = useT();
  const { line } = useProgress();
  const warmup = useMemo(
    () => pickLondonWarmup(pack, (id) => line(id)),
    [pack, line],
  );
  if (pack.id !== LONDON_PACK_ID || !warmup) return null;

  return (
    <button
      type="button"
      data-london-warmup
      className="home-warmup-chip"
      onClick={(event) => {
        event.stopPropagation();
        onStartLine(pack, warmup.line, "learn", {
          plyLimit: warmup.plyLimit,
          startPly: warmup.startPly,
        });
      }}
    >
      {t("London warm-up · {n} moves", { n: warmup.plyLimit })}
    </button>
  );
}
