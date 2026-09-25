import { Outlet, createFileRoute } from "@tanstack/react-router";
import { LessonsFrame } from "@/components/opening-lab/lessons-view";

export const Route = createFileRoute("/lessons_/$courseId")({
  component: LessonCourseLayout,
});

function LessonCourseLayout() {
  return (
    <LessonsFrame>
      <Outlet />
    </LessonsFrame>
  );
}
