import { PRICE_LESSON_SCOTCH } from "@/data/pricing";
import { parseCaptionScript, type LessonCue, type LessonMeta } from "@/lib/lesson-sync";
import { SCOTCH_BOARD_FILE } from "./scotch-board-cues";
import { SCOTCH_CAPTION_SCRIPT } from "./scotch-captions";

export const SCOTCH_LESSON_SLUG = "scotch";
export const SCOTCH_LESSON_RETURN = "/lessons/scotch";
export const SCOTCH_LESSON_INTRO_MP3 = "/lessons/scotch/intro.mp3";

type CueFile = {
  audioDurationSec: number;
  cues: LessonCue[];
  lessons: LessonMeta[];
  product: {
    id: string;
    name: string;
    lessonCount: number;
    freeLessonIds: string[];
  };
};

const file = SCOTCH_BOARD_FILE as CueFile;

export const SCOTCH_LESSON_AUDIO_SEC = file.audioDurationSec;
export const scotchLessonCues: readonly LessonCue[] = file.cues;
export const scotchLessonCaptions: readonly string[] = parseCaptionScript(SCOTCH_CAPTION_SCRIPT);
export const scotchLessons: readonly LessonMeta[] = file.lessons;
export const scotchLessonProductName = file.product.name;
export const SCOTCH_LESSON_PRICE = PRICE_LESSON_SCOTCH;

export function scotchLessonById(id: string): LessonMeta | null {
  return scotchLessons.find((lesson) => lesson.id === id) ?? null;
}
