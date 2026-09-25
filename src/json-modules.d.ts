declare module "*.json" {
  const value: {
    audioDurationSec?: number;
    resetToStartPly?: number;
    cues: Array<{ t: number; san?: string; fromPly?: number; note?: string }>;
    lessons?: Array<{ id: string; title: string; free: boolean; blurb: string }>;
    product?: {
      id: string;
      name: string;
      price: string;
      lessonCount: number;
      freeLessonIds: string[];
    };
  };
  export default value;
}
