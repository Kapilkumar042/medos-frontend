import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/lab/samples")({
  component: () => <ModuleStub title="Sample Collection" description="Manage sample collection workflow." />,
});
