import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/ipd/nursing")({
  component: () => <ModuleStub title="Nursing" description="Nursing notes and care plans." />,
});
