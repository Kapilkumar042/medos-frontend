import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/shared/ModuleStub";
export const Route = createFileRoute("/_authenticated/pharmacy/sales")({
  component: () => <ModuleStub title="Pharmacy POS" description="Point-of-sale medicine billing." />,
});
