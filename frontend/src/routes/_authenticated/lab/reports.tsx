import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/lab/reports")({
  component: () => <ModuleStub title="Lab Reports" description="Upload and review lab reports." />,
});
