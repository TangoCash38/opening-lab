import { createFileRoute } from "@tanstack/react-router";
import { LessonGate, LessonsFrame } from "@/components/opening-lab/lessons-view";

export const Route = createFileRoute("/lessons/$courseId/$lessonId")({
  component: LessonPlayerRoute,
});

function LessonPlayerRoute() {
  const { courseId, lessonId } = Route.useParams();
  return (
    <LessonsFrame>
      <LessonGate courseId={courseId} lessonId={lessonId} />
    </LessonsFrame>
  );
}
