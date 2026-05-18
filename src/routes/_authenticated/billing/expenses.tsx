import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/billing/expenses")({
  component: () => <ModuleStub title="Expenses" description="Track operational expenses." />,
});
