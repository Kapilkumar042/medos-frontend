import { createFileRoute } from "@tanstack/react-router";
import { CatalogManager, type CatalogField } from "@/components/master/CatalogManager";

export const Route = createFileRoute("/_authenticated/master/medicines")({ component: Page });

const fields: CatalogField[] = [
  { key: "code", label: "Item Code", placeholder: "MED001" },
  { key: "name", label: "Medicine Name", required: true },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "strength", label: "Strength" },
  { key: "packSize", label: "Pack Size" },
  { key: "unitPrice", label: "Price/Tablet/PC", type: "number" },
  { key: "dosageType", label: "Dosage Type" },
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
      // tableColumns={["code", "name", "manufacturer", "strength", "stock", "mrp"]}
      // priceField="mrp"
      tableColumns={["name", "dosageType", "packSize", "unitPrice", "stock", "mrp","expiry"]}
      priceField="unitPrice"
      fileBase="medicines"
    />
  );
}
