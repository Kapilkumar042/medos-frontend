import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/hr/attendance")({
  component: () => <ModuleStub title="Attendance" description="Daily staff attendance and shifts." />,
});
