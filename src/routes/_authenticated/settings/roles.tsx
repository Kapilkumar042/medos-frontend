import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/settings/roles")({
  component: () => <ModuleStub title="Roles" description="Define roles and access levels." />,
});
