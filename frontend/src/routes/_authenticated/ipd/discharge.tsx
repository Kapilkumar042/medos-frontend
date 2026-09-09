import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/ipd/discharge")({
  component: () => <ModuleStub title="Discharge" description="Discharge patients with summary." />,
});
