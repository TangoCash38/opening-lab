import { createFileRoute } from "@tanstack/react-router";
import { LessonCourse, LessonsFrame } from "@/components/opening-lab/lessons-view";

export const Route = createFileRoute("/lessons/$courseId")({
  component: LessonCourseRoute,
});

function LessonCourseRoute() {
  const { courseId } = Route.useParams();
  return (
    <LessonsFrame>
      <LessonCourse courseId={courseId} />
    </LessonsFrame>
  );
}
