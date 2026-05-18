import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/hr/payroll")({
  component: () => <ModuleStub title="Payroll" description="Salary processing and payslips." />,
});
