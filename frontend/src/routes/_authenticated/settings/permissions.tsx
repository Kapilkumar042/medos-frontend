import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/settings/permissions")({
  component: () => <ModuleStub title="Permissions" description="Granular permission matrix." />,
});
