import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/analytics")({
  component: () => <ModuleStub title="Analytics" description="Deep analytics across all modules." />,
});
