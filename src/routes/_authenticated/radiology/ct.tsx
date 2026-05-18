import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/radiology/ct")({
  component: () => <ModuleStub title="CT Scan" description="CT Scan scheduling and reports." />,
});
