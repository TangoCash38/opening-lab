import { createFileRoute } from "@tanstack/react-router";
import { LessonsCatalogue, LessonsFrame } from "@/components/opening-lab/lessons-view";

export const Route = createFileRoute("/lessons")({
  component: LessonsRoute,
});

function LessonsRoute() {
  return (
    <LessonsFrame>
      <LessonsCatalogue />
    </LessonsFrame>
  );
}
