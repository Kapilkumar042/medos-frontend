import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/billing/doctor-share")({
  component: () => <ModuleStub title="Doctor Share" description="Doctor revenue share calculations." />,
});
