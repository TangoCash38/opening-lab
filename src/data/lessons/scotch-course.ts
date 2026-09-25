import captionsRaw from "./CAPTIONS.txt?raw";
import boardFile from "./BOARD_CUES.json";
import { PRICE_LESSON_SCOTCH } from "@/data/pricing";
import { parseCaptionScript, type LessonCue, type LessonMeta } from "@/lib/lesson-sync";

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

const file = boardFile as CueFile;

export const SCOTCH_LESSON_AUDIO_SEC = file.audioDurationSec;
export const scotchLessonCues: readonly LessonCue[] = file.cues;
export const scotchLessonCaptions: readonly string[] = parseCaptionScript(captionsRaw);
export const scotchLessons: readonly LessonMeta[] = file.lessons;
export const scotchLessonProductName = file.product.name;
export const SCOTCH_LESSON_PRICE = PRICE_LESSON_SCOTCH;

export function scotchLessonById(id: string): LessonMeta | null {
  return scotchLessons.find((lesson) => lesson.id === id) ?? null;
}
