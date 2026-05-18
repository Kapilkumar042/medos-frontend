import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/radiology/xray")({
  component: () => <ModuleStub title="X-Ray" description="X-Ray scheduling and reports." />,
});
