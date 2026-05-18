import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/radiology/reports")({
  component: () => <ModuleStub title="Radiology Reports" description="All radiology reports." />,
});
