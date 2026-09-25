import { createFileRoute } from "@tanstack/react-router";
import { LessonGate } from "@/components/opening-lab/lessons-view";

export const Route = createFileRoute("/lessons_/$courseId/$lessonId")({
  component: LessonPlayerRoute,
});

function LessonPlayerRoute() {
  const { courseId, lessonId } = Route.useParams();
  return <LessonGate courseId={courseId} lessonId={lessonId} />;
}
