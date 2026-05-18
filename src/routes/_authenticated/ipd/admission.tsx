import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/ipd/admission")({
  component: () => <ModuleStub title="IPD Admission" description="Register inpatient admissions." />,
});
