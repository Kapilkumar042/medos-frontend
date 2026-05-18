import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/settings/users")({
  component: () => <ModuleStub title="Users" description="Manage system users." />,
});
