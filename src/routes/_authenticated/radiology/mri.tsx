import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/radiology/mri")({
  component: () => <ModuleStub title="MRI" description="MRI scheduling and reports." />,
});
