#!/usr/bin/env node
/**
 * Applies Potato Pie Practice auto-jump + queue + Caro intro stem to home-hero.tsx.
 * Idempotent: no-ops if already patched. Runs from package.json pretest/prebuild.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "src/components/opening-lab/home-hero.tsx");
let s = readFileSync(path, "utf8");
if (s.includes("Potato Pie jumps out as soon as this pack's Practice screen opens")) {
  process.exit(0);
}

const steps = [];

function replaceOnce(label, find, repl) {
  if (!s.includes(find)) {
    console.error(`apply-potato-practice-patch: missing anchor for ${label}`);
    process.exit(1);
  }
  s = s.replace(find, repl);
  steps.push(label);
}

replaceOnce(
  "caro-import",
  `} from "@/lib/scotch-coach-audio";
import { soundSelect } from "@/lib/sounds";`,
  `} from "@/lib/scotch-coach-audio";
import { CARO_INTRO_STEM, CARO_INTRO_STEM_AT_SEC } from "@/lib/caro-intro-stem";
import { soundSelect } from "@/lib/sounds";`,
);

replaceOnce(
  "queuedLineRef",
  `  const coachRef = useRef<CoachSession | null>(null);
  const onCoachBeat = useCallback((beat: number) => {`,
  `  const coachRef = useRef<CoachSession | null>(null);
  /** Line tap while the pack intro is up — run after intro (and Line 1 talk). */
  const queuedLineRef = useRef<OpeningLine | null>(null);
  const onCoachBeat = useCallback((beat: number) => {`,
);

replaceOnce(
  "reset-queue",
  `    setCoach(null);
    setTextBeat(0);
    stopScotchCoachNarration();
  }, [pack.id, linesInitiallyOpen]);`,
  `    setCoach(null);
    setTextBeat(0);
    queuedLineRef.current = null;
    stopScotchCoachNarration();
  }, [pack.id, linesInitiallyOpen]);`,
);

replaceOnce(
  "auto-jump-effect",
  `  }, [pack.id, linesInitiallyOpen]);

  const preferInFrame = () => {`,
  `  }, [pack.id, linesInitiallyOpen]);

  /**
   * Potato Pie jumps out as soon as this pack's Practice screen opens —
   * no Tap to practice required. Once per session; never in Test.
   */
  useEffect(() => {
    if (isComingSoonClosed(pack.id, purchased, subscribed)) return;
    const wantsScotch =
      scotchCoachApplies({ packId: pack.id, practiceEntry: true }) &&
      !scotchCoachAlreadySeen();
    const wantsPack =
      coachPackIntroApplies(pack.id) && !coachIntroAlreadySeen(pack.id);
    if (!wantsScotch && !wantsPack) return;
    let line: OpeningLine | undefined;
    if (pack.id === "caro-kann-black") {
      line = pack.lines.find((l) => l.id === "ckb1");
    } else {
      const samples = FREE_SAMPLE_LINE_IDS[pack.id];
      if (samples?.length) {
        line = pack.lines.find((l) => l.id === samples[0]);
      }
      if (!line) {
        line = pack.lines.find(
          (l) => subscribed || isLineUnlocked(pack, l.id, purchased),
        );
      }
    }
    if (!line) return;
    const asPracticeEntry = true;
    launchLine(line, undefined, asPracticeEntry);
    // launchLine is stable enough for pack entry; pack.id is the gate.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Practice open only
  }, [pack.id]);

  const preferInFrame = () => {`,
);

replaceOnce(
  "finish-queue",
  `      if (nextTalk) {
        launchLine(
          current.line,
          { plyLimit: current.plyLimit, startPly: current.startPly },
          false,
        );
        return;
      }
    }
    coachRef.current = null;
    stopScotchCoachNarration();
    setCoach(null);`,
  `      if (nextTalk) {
        launchLine(
          current.line,
          { plyLimit: current.plyLimit, startPly: current.startPly },
          false,
        );
        return;
      }
    }
    const queued = queuedLineRef.current;
    queuedLineRef.current = null;
    // A line tap during pack intro is applied here (do not skip Potato Pie).
    if (queued) current.line = queued;
    coachRef.current = null;
    stopScotchCoachNarration();
    setCoach(null);`,
);

replaceOnce(
  "line-tap-queue",
  `                          if (unlocked) {
                            if (pack.about) {
                              setPendingLine(item);
                              setAboutOpen(true);
                            } else launchLine(item);
                          } else onRequestUnlock?.(pack);`,
  `                          if (unlocked) {
                            // Pack intro is up — do not skip Potato Pie.
                            if (coachRef.current?.talk === "intro") {
                              queuedLineRef.current = item;
                              return;
                            }
                            if (pack.about) {
                              setPendingLine(item);
                              setAboutOpen(true);
                            } else launchLine(item);
                          } else onRequestUnlock?.(pack);`,
);

replaceOnce(
  "caro-stem",
  `                    <ScotchCoachBoard
                      key={coach.line.id}
                      flip={pack.side === "Black"}
                      frameCoords={!playApp}
                    />`,
  `                    <ScotchCoachBoard
                      key={coach.line.id}
                      flip={pack.side === "Black"}
                      frameCoords={!playApp}
                      stemSans={pack.id === "caro-kann-black" ? CARO_INTRO_STEM : undefined}
                      stemAtSec={pack.id === "caro-kann-black" ? CARO_INTRO_STEM_AT_SEC : undefined}
                      plyFallbackSec={coachPack(pack.id)?.introAudioFallbackSec}
                    />`,
);

writeFileSync(path, s);
console.log("apply-potato-practice-patch:", steps.join(", "));
