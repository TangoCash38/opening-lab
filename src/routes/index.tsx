import { createFileRoute } from "@tanstack/react-router";
import { OpeningLabApp } from "@/components/opening-lab/app-shell";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <OpeningLabApp />;
}
