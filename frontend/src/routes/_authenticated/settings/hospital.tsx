import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/settings/hospital")({
  component: () => <ModuleStub title="Hospital Setup" description="Configure hospital details and branding." />,
});
