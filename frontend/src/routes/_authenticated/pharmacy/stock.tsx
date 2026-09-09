import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/pharmacy/stock")({
  component: () => <ModuleStub title="Stock Management" description="Stock receipts, transfers, adjustments." />,
});
