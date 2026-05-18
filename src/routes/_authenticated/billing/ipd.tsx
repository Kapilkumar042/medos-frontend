import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/billing/ipd")({
  component: () => <ModuleStub title="IPD Billing" description="All IPD invoices and collection status." />,
});
