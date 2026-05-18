import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/reports")({
  component: () => <ModuleStub title="Reports" description="Generate operational and clinical reports." />,
});
