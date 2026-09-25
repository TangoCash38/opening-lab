import { createFileRoute } from "@tanstack/react-router";
import { LessonCourse } from "@/components/opening-lab/lessons-view";

export const Route = createFileRoute("/lessons_/$courseId/")({
  component: LessonCourseIndex,
});

function LessonCourseIndex() {
  const { courseId } = Route.useParams();
  return <LessonCourse courseId={courseId} />;
}
