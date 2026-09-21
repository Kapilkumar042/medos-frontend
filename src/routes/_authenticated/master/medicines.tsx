import { createFileRoute } from "@tanstack/react-router";
import { CatalogManager, type CatalogField } from "@/components/master/CatalogManager";

export const Route = createFileRoute("/_authenticated/master/medicines")({ component: Page });

const fields: CatalogField[] = [
  { key: "code", label: "Item Code", placeholder: "MED001" },
  { key: "name", label: "Medicine Name", required: true, placeholder: "Paracetamol 500mg" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "strength", label: "Strength", placeholder: "500mg" },
  {
    key: "form",
    label: "Form",
    type: "select",
    options: ["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Drops", "Inhaler", "Other"],
  },
  { key: "hsn", label: "HSN Code" },
  { key: "gstPercent", label: "GST %", type: "number" },
  { key: "purchasePrice", label: "Purchase Price (₹)", type: "number" },
  { key: "mrp", label: "MRP (₹)", type: "number", required: true },
  { key: "stock", label: "Stock Qty", type: "number" },
  { key: "batchNo", label: "Batch No." },
  { key: "expiry", label: "Expiry Date", type: "date" },
];

function Page() {
  return (
    <CatalogManager
      kind="medicine"
      title="Medicines"
      description="Pharmacy medicine master with pricing, batch and stock."
      fields={fields}
      tableColumns={["code", "name", "manufacturer", "form", "strength", "stock", "mrp"]}
      priceField="mrp"
      fileBase="medicines"
    />
  );
}
