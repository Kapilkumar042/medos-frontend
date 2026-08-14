import { createFileRoute } from "@tanstack/react-router";
import { CatalogManager, type CatalogField } from "@/components/master/CatalogManager";

export const Route = createFileRoute("/_authenticated/master/services")({ component: Page });

const fields: CatalogField[] = [
  { key: "code", label: "Service Code", required: true, placeholder: "AMB" },
  { key: "name", label: "Service Name", required: true },
  {
    key: "category",
    label: "Category",
    type: "select",
    options: ["Procedure", "Nursing", "Transport", "Consultation", "Room", "Other"],
  },
  { key: "unit", label: "Unit", placeholder: "per visit / per day" },
  { key: "price", label: "Price (₹)", type: "number", required: true },
  { key: "hsn", label: "HSN / SAC" },
  { key: "gstPercent", label: "GST %", type: "number" },
];

function Page() {
  return (
    <CatalogManager
      kind="service"
      title="Services"
      description="Other hospital services, procedures and non-medical charges."
      fields={fields}
      tableColumns={["code", "name", "category", "unit", "price"]}
      priceField="price"
      fileBase="services"
    />
  );
}
